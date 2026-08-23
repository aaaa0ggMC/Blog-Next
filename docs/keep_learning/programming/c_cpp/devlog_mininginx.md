---
title: MiniNginx = 1
date: 2025-10-07
category: c_cpp
tags: [C++, 网络编程]
desc: 从零实现 MiniNginx 服务器的七天开发日志。
---

# MiniNginx = 1
<np>为了学习网络知识（主要是在图形学卡得蛮久，水平不是很高一直坐牢，有点不想跟进了）为自己的UL服务端积累实践经历，我报名加入了华中科技大学的冰岩社团，在笔试面试过了后的某天上午，一个网址悄咪咪地发到了实习群。</np>
<Img content="/oIi2VuYb-Hf856t9UzQRQvo_vk-hmSqIVLq4aR9PnUBMM2__zOxG7jx899KV.png" />
<np>点进去后有四个实习项目可以选择，不过我只有C/C++的水平达到了入门级别，其他推荐的语言两个语言分别是Golang和Python。Golang不用说了，我学习了两天，也就大致把语法看了看，知道了个slice和defer啥的，你让我写个helloworld我甚至会给你写成这样：</np>

```golang
fn main(){
    str := "Hello World!"
    fmt.Println(str)
}
```

<np>当我看到自己写helloworld写成Rust,Golang杂交形态的时候我自己都绷不住了。而Python我向来都是让AI帮我写工具的，本身用的不是很熟练，因此我选择了C++项目——做出一个简易版的Nginx。</np>
<np>由于不能泄题的样子，我就大致描述一下最终要求：</np>

- 自己解析HTTP请求
- 支持反向代理
- 支持静态文件代理
- 支持master-worker形态
- 支持完备的日志系统
- 支持Epoll的IO多路复用
- 支持配置文件以及配置文件的热重载
- 关于网络方面不允许使用第三方库
- 负载均衡

<np>当我把文件丢给DeepSeek总结完看到这么多要求的时候，我人都有点炸了——我的天，网络这一方面我几乎零基础，这要求分明就是让我做出接近生产级的代码啊。但是一看其他的题目，三个都牵扯到了我在5年前学Java时了解到的后面一直没碰过的数据库（一点都不会）。于是我只好硬着头皮上了。</np>

## DAY1 2025/10/01
### 我会的
- 还行的C/C++知识
- 笔试那几天大致了解了怎么创建socket怎么listen啥的
- TCP会粘包

### 历程
<np>首先，既然是要做一个比较完整的项目，那么肯定项目的开工要有一定的仪式感，让你觉得赏心悦目且开始就把沉没成本拉上来，我优先把双语README给写了，格式是从<a href='https://github.com/deepseek-ai/DeepSeek-V3'>DeepSeek</a>和bgfx那里抄过来的，然后我改了改，同时偷来Nginx的Logo用GIMP改成了学习版Nginx：</np>
<Img content="/zSWtFt6i2XV3aky_OFQRebMMXVbne3vDacJO6_JR5l5VdEppJ8pHl1D67M0.png" />
<np>仪式感都到这个份上了，我还不得开工吗，我看到要求里面有日志需求，尽管没说不可以用类似spdlog等外部库，但是巧了，我的UnlimitedLife项目里面恰好有一个自制的日志处理器，于是我便兴高采烈地把我的aaaa0ggmcLib-g3中的alogger以及对应依赖文件直接copy进了项目，因此尽管我还没开工，项目就多了2500行代码了。（alib的其他组件如配置文件的读取啥的没搬因为配置文件要求自己设计读取方式）</np>
<np>由于这个项目肯定不能想我其他项目那样磨洋工然后动不动全部重构（点名经过4次从0开始重构无数小重构的UnlimitedLife），因此开始写的时候我就采用了最保险的写法，类似我的邪教同学高中时天天传教的<a href='https://euuen.github.io/glframework/amc/intro.html'>AMC</a>写法，我的大致设想是这样的，整个程序的资源都由一个叫作Application的类管理，然后main函数调用setup二次初始化再调用，于是一个十分简单的main.cpp便出来了，之后也只是加了个  signal(SIGPIPE, SIG_IGN);用于防止send出错直接终结我的程序与std::signal(SIGINT,[](int){std::exit(0);});用于在我按下ctrl+c强行终结程序的时候成功调用app的析构函数以及把app提升为了全局变量（因为局部的变量吃不到std::exit(0)的析构调用）：</np>

```cpp
#include <application.h>
#include <gtest/gtest.h>

int main(){
#ifdef MNGINX_TESTING
    testing::InitGoogleTest();
    return RUN_ALL_TESTS();
#endif

    mnginx::Application app;
    app.setup();
    app.run();

    return app.return_result;
}
```

#### 内存管理
<np>网络程序IO操作很频繁，这意味着内存分配释放也很频繁，所以一个内存池是比较重要的，好在c++17提供了好用且安全的&lt;memory_resource&gt;头文件，选择里面的一个memory_resource并绑定就可以全局让std::pmr这个命名空间里的所有容器和容器适配器用上对应的allocator了，我毫不犹豫地用上了pmr。</np>

#### 日志管理
<np>上文讲了，我用自己开发的轻量级日志库，这个日志库除了名字比较长——alib::g3::Logger&alib::g3::LogFactory&alib::g3::lot::XXX（因为我的alib迭代过几个版本，g4本来是准备结合C语言的，但是abi问题突然好了我就不管了），其他方面我还挺满意(DS总结的)：</np>
<pre>
====================From DeepSeek=======================
基于头文件分析，这个日志库支持的功能如下：
核心功能:
    多级别日志输出：TRACE、DEBUG、INFO、WARN、ERROR、CRITICAL
    预定义级别组合：FULL（全部级别）、RELEASE（发布级别）
输出目标支持
    控制台输出：支持颜色显示，线程安全
    单文件输出：输出到指定文件
    分割文件输出：按文件大小自动分割文件
    自定义输出目标：通过继承LogOutputTarget实现
日志过滤功能
    级别过滤：按日志级别过滤输出
    关键词屏蔽：包含敏感词的消息直接丢弃
    关键词替换：替换敏感信息为指定字符或字符串
    自定义过滤器：通过继承LogFilter实现
格式化选项
    时间显示：格式 [yyyy-mm-dd hh:mm:ss]
    日志级别显示：带颜色标识
    时间偏移显示：从Logger创建开始的毫秒数
    线程ID显示
    进程ID显示
    头信息显示：标识日志来源
    预定义格式组合：BASIC、FULL
高级特性
    线程安全：支持多线程环境
    流式输出：支持 << 操作符，自动处理STL容器
    条件编译：Linux下支持模板类型名称解码
    静态Logger实例：全局访问支持
    动态启用/禁用：可运行时控制输出目标和过滤器
数据类型支持
    基本数据类型
    std::string、C风格字符串
    STL容器：vector、map、unordered_map、tuple
    自定义类型（需实现toString）
平台支持
    Windows（CriticalSection）
    Linux（pthread mutex）
性能特性
    线程局部缓存减少内存分配
    预分配缓冲区
    可选容器类型名称显示
这个日志库提供了企业级日志系统所需的核心功能，具有高度的可扩展性和灵活性。
========================End=======================
</pre>
<np>所以这一块我也毫不犹豫的用了，顺便还用上了比较方便的autil和aclock用于处理一些杂项以及计时。</np>

#### HTTP解析
<np>把这些不要怎么动脑子只要选的东西搞好后我便着手做HTTP解析了，但是奇妙的是网上甚至没有一个很全面的教程，一般都是告诉你大致结构但是没有告诉你这样那样行不行，比如headers中key前面可以有空格吗，content-length如果是非数字怎么处理等等......我问AI，AI也是模棱两可，于是我去网上找到了<a href='https://httpwg.org/specs/rfc9112.html'>HTTP/1.1的doc</a>全部复制喂给AI然后询问才好了蛮多。花了一定时间后HTTP Request的parse和Response的generate都写好了，我让AI根据代码写了一堆google test，修改至TEST全过，这一天就这么结束了。</np>

## DAY2 2025/10/02
### Epoll
<np>俗话说要做肯定做最好的，既然文档都希望做epoll了，加上我本来也期望学习epoll，于是我便到bilibili找教程学习了select,poll和epoll。我开始还以为很难来着，结果发现核心就三个函数——epoll_create1,epoll_wait和epoll_ctl，基础的配置内容也是少之又少。我的天呐，我学习怎么写river的配置都比学习 epoll复杂，瞬间我就对epoll”祛难“了。一个小时后，一个epoll服务器就搭建完成了。</np>

### CI支持
<np>Epoll太出乎意料导致我留了蛮多时间，因此我决定给这么项目也写CI，毕竟我在接触Linux后项目管理用的几乎一直都是cmake，配置CI也不是很复杂（因为UnlimitedLife那里配置了，我直接CV改了改就可以运行了）。不过没想到里面的ubuntu容器的gcc版本才13，这怎么支持我的c++26啊，于是我抄代码配置了archlinux的容器成功编译代码。</np>
<np>写CI就会涉及到写编译脚本，因此我顺便给README里面加上了Build&Run这个部分。</np>

### Epoll结合HTTP
<np>做了这么多还有蛮多时间，因此我就把epoll和http解析结合在了一起，经过了几个小时总算是做好了GET和POST的读取，不过带MessageBody的请求目前只支持Content-Length和TransferEncoding:chunked</np>

### URL处理
<np>就是分离参数和主路径以及把%XX替换成对应的u8字符。</np>

## DAY3 2025/10/03
<np>现在EPOLL有了，URL识别有了，HTTP GET与POST也能正常工作了，加上我第一印象就觉得文件代理做起来不难，于是这一天的目标便是做文件代理。但是并不是所有的route都会链接到文件代理，因此我需要做一个能将网页的route正确映射到对应处理的东西，我把它叫作RouteTreeStateMachine，也就是一个基于树形结构的路径状态机。</np>

### 路径状态机
<np>首先我得说说我怎么想到状态机的，因为我发现每一个/XXX/之间的XXX都属于一种状态，一系列状态的叠加恰好就是我对应的处理器需要的状态，这不用NFA来表示整个链的话我都觉得可惜极了，而/XXX/本身又是类似文件系统的树形结构，因此整个数据结构会大致呈现树形，所以就叫作RouteTreeStateMachine了。</np>
<p align='center'>那么，问题来了，这个状态机是怎么构造又是怎么运作的呢？</p>
<np>我先不直接处理路径，我先抽象出了路径的数据结构来适配状态机，也就是一个个Node,每个Node可以有多个子Node,有对应的数据，说白了就是多叉树。不过用户创建一条路径规则的时候形状肯定是一条链，因此我提供StateNode给用户而不是内部的Node。在往现有的状态机里面加入新的规则的时候StateMachine会用类似双指针的方式沿着Node树与StateNode链找到对应的节点并用上对应的处理函数：</np>
<Img content="/jzvD_n9wYOrlPaq7hrdXBkFCgL_EMQ6_6Id4vtP23KqosNXhlkKfg2XPtxgw9cHwrxg.png" />
<np>每个节点的规则有两条，一条是FixedString用于处理固定字符串，一条则是Match_Any即任何字符串都匹配，其他模式我觉得也没什么必要于是就不打算支持了。FixedString的优先级高一点。有了这个状态机后，我立马就搭了个HelloWorld：</np>

``` cpp
StateNode file;
file.node(HandlerRule::Match_Any);
handlers.add_new_handler(file, [](HTTPRequest & rq, const std::pmr::vector<std::pmr::string>& vals, HTTPResponse& rp){
    rp.status_code = HTTPResponse::StatusCode::OK;
    rp.status_str = "OK";
    rp.headers["Content-Type"] = "text/html; charset=utf-8";
    rp.headers["Connection"] = "close";
    
    std::string first_val = vals.empty() ? "No Value" : std::string(vals[0].data(), vals[0].size());
    std::string html = "<html><body><h1>Hello World</h1><p>Value: " + first_val + "</p></body></html>";
    
    // 直接构造 HTTPData (pmr::vector<char>)
    rp.data.emplace(html.begin(), html.end());
    rp.headers[KEY_Content_Length] = std::to_string(rp.data->size());
    
    return HandleResult::Continue;
});
```

<np>解释一下，第二行就是创建一个根目录match any的路由，对应的处理是下面的lambda函数，我用的是std::function来存储，虽然有一些开销但是灵活性很高，加上这是实习项目所以我也就没做更多的区分优化了（就是对可以cast为指针的对象用指针存储（一般为静态函数））。输入Request输出Response啥的。</np>

### 简单的静态文件管理
```cpp
file = StateNode();
file.node("file").node(HandlerRule::Match_Any);
handlers.add_new_handler(file, [](HTTPRequest & rq, const std::pmr::vector<std::pmr::string>& vals, HTTPResponse& rp){
    rp.status_code = HTTPResponse::StatusCode::OK;
    rp.status_str = "OK";
    rp.headers["Content-Type"] = "text/plain; charset=utf-8";
    rp.headers["Connection"] = "close";
    
    // let's read
    std::string ou = "";
    std::string path ="/sorry/path/encrypted/";
    path += vals[1];
    alib::g3::Util::io_readAll(path,ou);
    
    std::cout << "PATH:" << path << std::endl;

    // 直接构造 HTTPData (pmr::vector<char>)
    rp.data.emplace(ou.begin(), ou.end());
    
    return HandleResult::Continue;
});
```
<np>然后我拿这个读4GB数据，成功把我的浏览器和我的服务器都卡住了。</np>

### Docs && Doxygen
<np>目前的代码已经有一定量了，是时候进行一次激动人心的codereview了，实际上review的地方不多，写doc的地方倒是蛮多。把大部分东西都doc后我搬来UnlimitedLife的Doxyfile，改了改又搬来了Doxygen的CI文件，于是Doxygen就配置好了。</np>

## DAY4 2025/10/04
<np>现在虽然有handler了，整体的可读性也还行，但是你不觉得Application为了构建一个handler看起来不好看吗？对的，我觉得handlers.add_new_handler...一点都不好看，主要是lambda插进来太丑了，于是我决定设计一个ModuleKernel用于支持add_module(XXX)简洁地导入模块，同时这样还能让模块核心和Application解耦，组合式写法看起来就赏心悦目。</np>

### 基于Policy的模块系统
<np>我设计的模块是一个个类，类中必须要有一个静态的handle函数，可选静态的module_init和module_timer。做起来确实不麻烦，但是类的加载方面我的做法比较奇怪——基于Policy进行函数注册。我也不知道自己为什么脑抽了想用Policy，估计是写UL的ECS系统的时候没用上这个特性于是便想试试。我当然知道自己有其他方案，比如基于requires进行函数判断或者基于类中特殊的对象进行注册而不是用户注入policy。但总而言之，目前的使用如下：</np>

```cpp
template<HasModuleHandler T,class Policy,class... Policies> inline StateTree::AddResult add_module(const StateNode & tree){
    Policy::template bind<T>(mods);
    return add_module<T,Policies...>(tree);
}

template<HasModuleHandler T> inline StateTree::AddResult add_module(const StateNode & tree){
    return handlers.add_new_handler(tree,T::handle);
}

void Application::setup_modules(){
    using namespace modules;
    StateNode root;
    root.node("mod").node("rp").node(HandlerRule::Match_Any);
    add_module<ModReverseProxy,PolicyFull>(root);
}
```
<np>可以看到，至少application中的代码不那么冗杂了。</np>

### 对解析出来的参数的id映射
<np>我的RouteManager会把识别出来的一个个节点的具体值也传进handler中，这对于固定数据当然没什么用（也不是彻底没用，对与 /api/root这个路径，对/api/root/hehe的访问产生的节点值如下： api root/hehe，因此还是有用的），但是对于match_any用处可大了。不过之前用的一直是vector，这意味着处理器是对路径依赖很大的，这不好。因此我加入了对ID的映射，这样就可以通过查找ID对应vector的数据位置从而安全获得数据了。</np>

### 反向代理
<np>后面一直在折腾反向代理，但是一直没做出来，折腾好久，我去我去，我写的是auto client = clients.try_emplace...而不是auto& client！！！这种可恶的低级错误当场气晕我，我发誓自己再也不随便用auto了，结果后面对于类型不明确（我没记住）的我还是用auto去了。</np>

## DAY5 2025/10/05
<np>由于要求自己写配置，因此我便怼这nginx配置看了看自己着手写了些，写完词法分析+简单语法分析一看代码只有148行，我直接吓哭了——怎么这么简单：</np>

```cpp
Config::LoadResult Config::load_from_buffer(std::string_view data){
    if(data.empty())return LoadResult::EOFTooEarly;
    std::vector<std::string> tokens;
    std::string buffer = "";

    bool in_str = false;
    bool escape = false;

    size_t i = 0;

    char ch;

    while(i < data.size()){
        ch = data[i];
        ++i;
        if(in_str){
            if(escape){
                escape = false;
                switch(ch){
                case '\\':
                case '\"':
                case '\'':
                    buffer.push_back(ch);
                    break;
                default:
                    buffer.push_back('\\');
                    buffer.push_back(ch);
                }
                continue;
            }else{
                if(ch == '\\'){
                    escape = true;
                    continue;
                }else if(ch == '\"'){
                    in_str = false;
                    // and we finished a token
                    buffer = "\"" + buffer + "\""; // to prevent "{" "}"
                    tokens.push_back(buffer);
                    buffer.clear();
                    continue;
                }
                buffer.push_back(ch);
            }
        }else{
            if(ch == '\"'){
                in_str = true;
                continue;
            }
            if(isspace(ch)){
                if(!buffer.empty()){
                    // we finished a token
                    tokens.push_back(buffer);
                    buffer.clear();
                }
                continue;
            }
            if(ch == '{' || ch == '}' || ch == ';'){
                // finshed the prev token and add this token along
                if(!buffer.empty()){
                    tokens.push_back(buffer);
                    buffer.clear();
                }
                tokens.emplace_back();
                tokens[tokens.size()-1].push_back(ch);
                continue;
            }
            buffer.push_back(ch);
        }
    }

    return analyse_words(tokens);
}

Config::LoadResult Config::analyse_words(std::vector<std::string> & tokens){
    std::stack<Node*> tree;
    /// clear data
    config_nodes = Node();
    config_nodes.children.push_back(Node());
    Node * current = &config_nodes.children[0];

    tree.push(&config_nodes);
    tree.push(current);
    

    for(size_t i = 0;i < tokens.size();){
        auto & tk = tokens[i];
        ++i;
        if(!tk.compare("{")){
            if(!current->name.compare("")){
                // at least a name is required
                return LoadResult::WrongGrammar; 
            }
            // to the next depth of node
            current->children.push_back(Node());
            tree.push(&(*(current->children.end()-1)));
            current = tree.top(); // move to child
        }else if(!tk.compare("}")){
            if(tree.empty()){
                // @todo add more infos
                return LoadResult::WrongGrammar;
            }
            // to the prev depth of node
            tree.pop();
            bool dec = false;
            if(!current->name.compare(""))dec = true;
            if(tree.empty())return LoadResult::WrongGrammar;
            current = tree.top();
            if(dec && current->children.size() > 0){
                current->children.erase(current->children.end()-1);
            }
            tree.pop();
            if(tree.empty())return LoadResult::WrongGrammar;
            current = tree.top();
            // move to next 
            current->children.push_back(Node());
            tree.push(&(*(current->children.end()-1)));
            current = tree.top();
        }else if(!tk.compare(";")){
            if(!current->name.empty()){
                // add new node
                tree.pop();
                if(tree.empty())return LoadResult::WrongGrammar;
                current = tree.top();
                current->children.push_back(Node());
                tree.push(&(*(current->children.end()-1)));
                current = tree.top();
            }
            continue;
        }else{
            if(current->name.empty())current->name = tk;
            else current->values.emplace_back(tk);
        }
    }

    size_t sz = config_nodes.children.size();
    if(sz && !config_nodes.children[sz-1].name.compare("")){
        config_nodes.children.erase(config_nodes.children.end() -1);
    }
    return LoadResult::OK;
}
```
<np>反正四十分钟就做完了，过了所有测试，识别也符合预期，这让我情不自禁地在AI面前吹嘘了20分钟，然后看着AI拍的马屁。</np>

### 日志重构
<np>写完后还有时间，因此我便花了蛮久时间把所有的日志全部规范化了，包括对access和error日志的区分，以及从Application中抽象出Server。开始写的时候是11点，我执行./on_music_mode脚本开启我的音乐模式然后边听音乐边做，结果提交完后发现已经5点钟了，可把我吓了一跳，我溜上了床睡到了10点半。</np>

## DAY6 2025/10/06
<np>这就比较无趣了，首先便是改进add_module支持传递参数，之后便折腾配置文件的加载。最后把反向代理和服务器的配置搞好了。</np>

## DAY7 2025/10/07
<np>花了20min加了个新的module，对，就是静态文件代理，然后花了40min做了配置文件的读取，花了30min把服务器从单线程搞成了多线程，然后花了10min把配置热加载搞好了（但是要手动输入，不过大差不差了，以为检测文件修改时间也不难），最后花了3h写doc进行性能测试，最终验证啥的，这个项目就算完工了。</np>

## 总结
看README_cn.md吧，写不动了
