---
title: 地形生成
date: 2022-10-11
tags: [C++, UnlimitedLife]
category: coding
desc: 一次对于地形的探索
highlight: true
transcribed_at : 2026-09-08
---

::: ps
初三/高一时期的比较无聊写的作品。
这都是纸上写代码的，因此错误会很多很多，不具备多少学习价值，当故事看就行了。
:::

# 地形生成

## 前言
由于在Mod上折腾了太久，我决定先做游戏内容，再看Mod.

## 我的目标树
- v1.0 纯土地形，无限生成，区块动态加载卸载，仅有背景层
- v2.0 多彩背景，加入前景层 <span class="ps"> 2023.3.5 目前已达这里</span>
- v3.0 多维及空间，游戏内局部常加载（服务器可选择启用，客户端可选择关闭）
- v4.0 添加高度景
- v5.0 渲染效果（水的流动，着色器）

## 目前阶段 v0.0 ><
### 背景层与世界
为了日后方便，我加入了Dimension来方便改造，其结构如下：

$$
\text{Game} \to \text{World} \to \text{Dimension(s)::layer\_background(lb)} 
$$

其实Dimension下面还有Chunk, lb为Chunk中的元素，上述有些问题。一个Chunk中有32\*32个图格，每个图格为32\*32像素大小。故Chunk中便有这一元素： `Tile * tiles[32][32]`，其会在Chunk构造时在堆上被分配地址。 但是，这是背景层，故该元素准确点应该为：
```cpp
BackgroundTile * lb[32][32]; 
// 其中BaclgroundTilee继承自AbstractTile，它们的结构如下
// （以后肯定会改）

struct AbstractTile{
    unsigned int id; // 内部图格id
    std::string name; // 图格索引字符串，不可以数字开头
    // 或者以数字开头且整个自渡船表示数字时可能会用去索引id
    sf::Tetxure * texture; // 贴图地址

    virtual void draw(sf::RenderTarget *, sf::Vector2f);
};

struct BackgroundTile : public AbstractTile {

}; // 目前不做任何修改
```

### 区块加载与卸载
区块加载目前被分为两大块：强加载与不加载

强加载分为绘制域与非绘制域，会动态更新内部生物活动、电路运作、设施工作等等（不加载不会进行这一块）。 在绘制域的生物等对象会被绘制，而在非绘制区域以及不加载区块除了生物下底面与屏幕相交否则不会进行绘制（指生物的碰撞想与屏幕相机空间产生碰撞）。

强加载的区块用一个`struct`来描述：
```cpp
struct HighlyLoadChunkDescriptor{
    Pt2Di center; // 描述一个中心点区块
    uint size; // 由中心向外延伸多少格，0表示1x1，1表示3x3
    uint dimension_id; // 维度id
};

using HChunkDesc = HighlyLoadChunkDescriptor;
```
由一个HChunkDesc的vector来描述所有常加载区块：
```cpp
vec<HChunkDesc> cCDes;
```

常加载区块的加载将把区块载入一个map中，mapV的泛型类型则为CDataDesc(ChunkDataDescriptor):
```cpp
struct CDataDes{
    vector<Chunk*> chunks;
    HChunkDesc desc;
};

map<int,CDataDesc> cCDDes; // 其中int key表示维度id
```

因此，在GameManager中加载常加载区域的代码为：
```cpp
GameManager::LoadPerm(){
    for(cd : cCDes){
        // 查找已加载区块
        CDataDes * c = CH::QuickFindDesc(cd, cCDDes);
        if(c) cm.UnloadCDataDes(*c); // cm为 ChunkManager，释放区块
        tmp_c.insert(make_pair(cd.dimension_id, cm.LoadCDataDes(cd))); // 插入区块
    }
}

cCDDes = tmp_c; // 重新赋值
```

除了常加载区块，还有玩家周围的动态加载区，其不必用结构体标识，由类Player中的3个成员来管理：
```cpp
vec<Chunk*> rChunks; // 动态加载的区块
unsigned int rSize; // 伸长量大小，与HChunkDesc::size无异
unsigned int dimension; // 处于的维度
```
其加载代码如下：
```cpp
GameManager::UpdateDynamic(){ // 当玩家处于一个新的区块的时候调用
    vector<Pt2Di> chunkIds = CH::QuickBuildSurrId(player.position.ChunkId(), rSize);
    vector<Chunk*> temp_c = cm.QuickBuildChunks(chunkIds);

    cm.ReleaseChunks(rChunks);
    rChunks = temp_c;
}
```
该方法有些许巧妙，首先函数先创建中心区块以rSize为半长得区块点列表，之后将所有点传入并创建Chunk. 注意！如果ChunkId中有些区块已被rChunks中加载，那怎么办呢？ ChunkManager会将Chunk的引用加1,即调用Chunk::addRef()。之后释放旧区块时又将Chunk的引用减1。然后就没问题了，该代码便可实现在保持可见区块不删的情况下，删去应该删除的区块。

其中， 在LoadChunks后， ReleaseChunks前会有稍微的内存波动，但也无大碍。

是故完成加载。

### 加载区块
在QuickBuildChunks, ReleaseChunks等函数中，核心代码都为ChunkManager::LoadChunk与ChunkManager::UnloadChunk，代码如下：
```cpp
ChunkManager::LaodChunk(dimension_id,pt){
    Chunk * c = CH::FindCHunk(loadedChunks, dimension_id, pt);

    if(!c){
        c = ChunkBuildFn[dimension_id](pt);
        loadedChunks.push_back(c);
    }
    // 添加引用
    c->addRef();

    return c;
}

ChunkManager::UnloadChunk(Chunk * c){
    c->delRef();
    if(!c->getRef()){
        loadedChunks.erase(get_iterator(loadedChunks,c));
        delete c;
    }
}
```

### 区块渲染
说了那么多，如果不对区块进行渲染，那也是徒劳。因此，对世界渲染也格外重要，渲染的内容应当如下：
1. 生物
2. 各层图格
3. 着色器

而我们目前仅讨论图格。

图格的绘制如下：

之前我有一种做——把与绘制区域相交的区块通通一起绘制。但这无疑是愚蠢的。因此必须采用另一种方式绘图，称为——边界绘图。

首先，我们要估测纵向与横向需要绘制的方格

$$
\begin{align}
    & P_x = 2 \lceil \frac{w}{2 * \text{bsz}} \rceil + \text{bias}_x \\
    & P_y = 2 \lceil \frac{h}{2 * \text{bsz}} \rceil + \text{bias}_y
\end{align}
$$

其中，bias用于调整零碎个数，但经过了我的一轮苦想，我有了一个方案：
干脆多绘制一点嘛！

首先，先看下其他未采用的方案：

#### 全区块画法
此方法性能偏差十分大，特别当你范围里有多个区块时，比如$3 * 3$玩家加载域中与$32*24$的观察范围范围时，最多有4个区块，此时需绘制$32*32*4=4096$个方格，而原来显示的方格只有768左右。此方法耗时将为极佳法的$\frac{16}{3}$！帧率可从160fps降到30fps。故直接抛弃了这种方法。

#### 极佳法
极佳法通过估测大小，尝试在外围添加最少的方格，使得画面变得完整。但估算算法十分困难（对我而言），因此我转向了最后的那种方法。

#### 绘制定长放缩法
我的方案便是绘制定长放缩法。

此方法有前提！——视野长度必须皆为偶数，但这影响不大，因为视野长度的非线性不代表Camera缩放也非线性！即，Camera缩放时绘制区域不变，这个特点`sf::View`已提供。

那么我的方法怎么说呢？

首先，对P坐标取整，之后遍历P左端$\frac{V_w}{2} + 1$，上端$\frac{V_h}{2} + 1$到下端的所有方块即可。

绘制方格固定为$32*26=884$。耗时比为$\frac{221}{192}$，当极佳法为221fps时，差值仅为9fps。如果对齐扩充的方格组再做四次简单的x-y便捷检测，其性能甚至能达到极佳法的效果。

由于扩充法限制，必定会多出(h+w+1)个为无用的图格，故此时使用简单的便捷判定便可排除这些图格，从而大幅度提升速度。 <span class="ps"> 2023: 事实验证，根本不要判，直接去除</span>

故，我们便有了基本的逻辑了，可以得出其源代码：

```cpp
/*更新位置时调用*/
GameManager::UpdateView(){
    viewerGroup.clear();

    for(Chunk * c : rChunks){
        if(c->rect.intersects(view.rect))viewerGroup.push(c);
    } /*从强加载区块中检索碰撞*/
    viewerGroup.form();
    
    Pt2Di ipp = player.position.toInt();

    // 2023: 改为 w/2 h/2! 大发现！
    from = ipp - Pt2Di(w/2 + 1,h/2 + 1);
    end = ipp + Pt2Di(w/2 + 1,h/2 + 1); 

    // optional: Another four collisions to remove 2 lines of tiles
}

/*绘制*/
GameManager::Paint(){
    Pt2Df start = ts * (player.position.toInt() - player.position)''

    Pt2Di pf = from;

    for(;pf.x <= end.x; ++pf.x){
        for(;pf.y << end.y;++pf.y){
            Block * b  = viewerGroup[pf];
            if(b){
                draw(b,start + ts * (pf - from));
            }
        }
    }

}

ViewerGroup::push(Chunk * c){
    unseri.push(c);
}

ViewerGroup::form(){
    if(!unseri.size())return;

    std::sort(unser.begin(),unseri.end(),[&](Chunk * a,Chunk * b){
        if(a->id.y > b->id.y)return false;
        else if(a->id.y == b->id.y && a->id.x > b->id.x)return false;
        else return true;
    }); // 从小到大排序

    vec<Chunk*> temp;

    Vmaps.clear();
    for(unsigned int i = 0;i < unseri.size();++i){
        if(i != 0){
            if(unseri[i-1]->id.y != unseri[i]->id.y){
                Vmaps.push_bacl(temp);
                temp.clear();
            }
        }
        temp.push_back(unseri[i]);
    }
    Vmaps.push_back(temp);
}

/*重载ViewerGroup []*/
operator ViewerGroup::[](Pt2Di ptAb){
    // In: 绝对空间坐标
    Pt2Di  rela = ptAb - (*Vmaps.top()->top())->ltbase();
    Pt2Di inRela = rela / CHUNK_SIZE, rest = rela % CHUNK_SIZE;
    
    // 2023 : 补充，，应该在非法地方返回NULL
    if(inRela.x >= Vmaps.size())return NULL;
    else if(Vmaps[inRela.x].size() <= inRela.y)return NULL;
    // 2023: end
    
    return Vmaps[inRela.x][inRela.y]->blocks[rest.x][rest.y];
}
/*Optional Operator*/
~Optional(){
    // 先不讨论
}

/** 总结
用了上百条运算指令换取了上万条内存复制指令，其最终的效果肯定很值（除非OpenGL缓冲区可以自动删去完全不相交的物体，但总之，这是绝对有效的）。且此代码也能兼容玩家视角缩放，区块大小增减......

PS: 代码为C++伪代码
Author: aaaa0ggmc
2022-10-12
*/

```


::: leave
Cheers! <br/>
2022/10/11
:::