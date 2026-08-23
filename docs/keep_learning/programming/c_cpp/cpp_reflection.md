---
title: 静态反射 -- C++的里程碑功能
date: 2026-05-08
category: c_cpp
tags: [C++]
desc: 初探 C++26 静态反射这一里程碑特性的使用体验。
highlight: true
---

# 静态反射 -- C++的里程碑功能

## 目录
[[toc]]

## 前言
<np>
在2026年4月30日，GNU憋了一年的正式版本GCC终于是出炉了，我在有时间后更新完系统也是尝试了一下，这是我目前的简要结论：
<span class='hl'>这绝对是最令人兴奋的一个特性了！</span> 
</np>

> 注：以下测试基于GCC 16.1.1的支持以及其对应的\<meta\>文件，不一定是最终产品
> 毕竟目前(2026/05/08) cpp reference上面还没有偏官方的文档
> 因此我这里给出的只是抢先服的使用说明

<np>
有了静态反射，受益最大的就是序列化与反序列化这一块，其次便是更加灵活的程序流控制。我感觉自己有了这个特性之后都快羽化而登仙了。
</np>

## 缺陷（以我目前的认知）

<np>
但是显然也有缺陷，如果你还没有了解C++反射可以跳过这一节看下面的简单教程,这是我目前使用所发现的一些缺点（这些是我浅度使用发现的问题，很可能是我见识不够，这一块我也很乐于改进）：
</np>

### constexpr vector这个feature用起来还是很别扭

> [However, defining a constexpr std::vector variable is generally an error, because constant evaluation requires any dynamically allocated storage to be released in the same evaluation, which is usually not the case with std::vector's initializer.](https://cppreference.com/cpp/container/vector)

于是你以为最小化的遍历访问是这样的：

```cpp
#include <alib5/alogger.h>
#include <alib5/compact/manip_table.h>
#include <meta>

using namespace alib5;

struct HiMeta{
    int age;
    int biscuit;
    int calendar;
};

int main(){
    constexpr auto context = std::meta::access_context::current();
    template for(constexpr auto item : std::meta::nonstatic_data_members_of(^^HiMeta,context)){
        aout << std::meta::identifier_of(item) << fls;
    }
}
```
实际就会遇到这样的报错

```txt
[build] ./main.cpp:17:5: error: ‘std::meta::nonstatic_data_members_of(^^HiMeta, context)’ is not a constant expression because it refers to a result of ‘operator new’
[build]    17 |     }
[build]       |     ^
[build] In file included from /usr/include/c++/16.1.1/string:46,
[build]                  from /usr/include/c++/16.1.1/bits/stdexcept_throw.h:57,
[build]                  from /usr/include/c++/16.1.1/array:44,
[build]                  from /usr/include/c++/16.1.1/format:46,
[build]                  from /usr/local/include/alib5/autil.h:10,
[build]                  from /usr/local/include/alib5/log/kernel.h:26,
[build]                  from /usr/local/include/alib5/alogger.h:10,
[build]                  from ./main.cpp:1:
[build] /usr/include/c++/16.1.1/bits/allocator.h:203:52: note: allocated here
[build]   203 |             return static_cast<_Tp*>(::operator new(__n));
[build]       |                                      ~~~~~~~~~~~~~~^~~~~
```

因此你不得不加入一个std::define_static_array进行一波魔法转换:
```
template for(constexpr auto item : std::define_static_array(std::meta::nonstatic_data_members_of(^^HiMeta,context)))
```
<span class='ps'>这长度我一口气都看不完......</span>

### 报错信息简直糟糕
C++的报错信息本来就是所有语言里最难看懂的一档，结果目前的实现中，meta会在匹配失败的时候返回一个异常，异常捕捉麻烦（GCC虽然出了静态try catch但是和原本的try catch语法一模一样，仅会在你整个函数是constexpr/consteval时启用）就算了，异常字符串也十分“简洁”，属于是该丰富的就简洁。。。
```cpp
constexpr auto context = std::meta::access_context::current();
template for(constexpr auto item : std::define_static_array(std::meta::members_of(^^HiMeta,context))){
    aout << std::meta::identifier_of(item) << fls;
}
```

```txt
[build] ./main.cpp:16:41: 
error: call to consteval function ‘std::meta::identifier_of(^^HiMeta::~HiMeta())’ is not a constant expression
[build]    16 |         aout << std::meta::identifier_of(item) << fls;
[build]       |     
error: uncaught exception of type ‘std::meta::exception’; ‘what()’: ‘has_identifier 的反射失败’
```
我都不知道到底是哪个部分的遍历出现异常了，这真的很奇怪，虽然可以通过std::meta::has_identifier进行预先判断。

### 很丑
这是一份代码
```cpp
template<class T>
log_table generate_table(T && v){

    log_table table([&v](auto & op) mutable {
        constexpr std::meta::access_context context = std::meta::access_context::current();
        int i = 1;
        template for(
            constexpr auto item 
            : 
            std::define_static_array(
                std::meta::nonstatic_data_members_of(^^std::decay_t<T>,context)
            )
        ){
            constexpr auto item_type = std::meta::type_of(item);
            std::string_view str = std::meta::display_string_of(item_type);
            op[i][0] << log_omit(str,40);
            op[i][1] << try_get_identifier<item>();
            
            auto & val = v.[: item :];
            if constexpr(requires(StreamedContext<LogFactory> && ctx){
                std::move(ctx) << val;
            }){
                op[i][2] << val;
            }else if constexpr(std::meta::is_class_type(item_type)){
                op[i][2] << generate_table(val);
            }else{
                op[i][2] << log_bin(val);
            }
            
            ++i;
        }

        if(i > 1){
            op[0][0] << "Type";
            op[0][1] << "Name";
            op[0][2] << "Value";
        }
    });
    table.config = table.modern_dot();
    return table;
}
```
它确实很强大，但是确实让我觉得有点丑。。。

## 开始
整个C++静态反射最重要的就是这两个符号：
- ^^ 
- [: :]

### ^^
<np>这个长得像猫耳朵的符号便是把类型转换成其对应的std::meta::info。<span class='ps'>(其实原本是'^'的，但是似乎是clang那边这个符号已经有用处了，于是就要进行修改，最后选择了^^。)</span></np>

比如:
```cpp
#include <meta> // 后面就省略这个了

// 直接搭配类型
std::meta::info int_info = ^^int;
// 还可以用于模板生成的类型
std::meta::info teeth_info = ^^std::decay_t<T>;
// 当然可以是decltype的
std::meta::info value_info = ^^decltype(value_generated);
```

std::meta::info是一个句柄，并且目前来看是完全编译期间的，因此用 std::meta::info = xxx就可以了，没必要 std::meta::info & = xxx,这样反而复杂化了。

### [: :]
<np>而这个长得像潜影贝的符号所对应的操作叫做splice,其作用便是类似C语言宏那样把两个东西连在一起，从而形成新的编译器可以解析的语义单元。比如：</np>

```cpp
struct A{
    int a;
    int b;
};

int main(){
    A a;
    // 注意，^^对后面跟的东西十分敏感，不能多一个括号
    // 比如 ^^(A::a)便会告诉你这不是一个能进行反射的算子
    // 同理 ^^(decltype(1)) 也是不行的：  error: ‘^^’ cannot be applied to this operand 
    constexpr std::meta::info info = ^^A::a;
    aout << a.[: info :] << fls;
}
```
最后的结果便是输出a.a这个变量。那么splice具体支持哪些结构的组合呢，见下面的代码：
```cpp
#include <alib5/alogger.h>
#include <alib5/compact/manip_table.h>
#include <meta>

using namespace alib5;

namespace outer{
    namespace inner{
        struct B{
            int a;
            int b;
        };

        namespace inner{
            struct C{};
        }

    }
    struct A{
        static int c;

        int a;
        int b;
    };
}

int outer::A::c;

int main(){
    constexpr std::meta::info outer_namespace = ^^outer;
    constexpr std::meta::info inner_namespace = ^^outer::inner;
    constexpr std::meta::info inner_inner_namespace = ^^outer::inner::inner;
    
    //// 命名空间 ////
    // 访问外部
    [: outer_namespace :]::A a;
    /// 访问内部
    [: inner_namespace :]::B b;
    /// 这个也可以哈哈，属实是奇特
    [: outer_namespace :]::[: inner_namespace :]::B c;
    // 无法编译，可以发现这个东西不是基于原始符号的简单替换，而是包含语义信息的
    // [: outer_namespace :]::[: inner_namespace :]::[: inner_namespace :]::C d;
    // 内部的内部同理
    [: inner_inner_namespace :]::C d;
    [: inner_namespace :]::[: inner_inner_namespace :]::C e;
    [: outer_namespace :]::[: inner_namespace :]::[: inner_inner_namespace :]::C f;    
    // 可以发现似乎是随意“穿透”的
    [: outer_namespace :]::[: inner_inner_namespace :]::C g;

    //// 成员变量 ////
    using namespace outer;
    constexpr auto a_info = ^^A;
    constexpr auto a_a_info = ^^A::a;
    constexpr auto a_c_info = ^^A::c;
    A target;
    // 静态成员
    target.[: a_c_info :] = 1;
    [: a_c_info :] +=  1;
    // 这个不支持：
    // [: a_info :]::[: a_c_info :] += 1;
    [: a_info :]::c += 1;
    // 成员变量
    target.[: a_a_info :] += 1;
    // 但是这个是不支持的
    // target.[: a_info :]::[: a_a_info :] += 1;
    target. A::a += 1;

    //// 基类继承 ////
    constexpr auto get_base = [](auto && v) consteval -> std::meta::info {
        using T = std::decay_t<decltype(v)>;
        if constexpr(std::is_same_v<T, int>){
            return ^^outer::A;
        }else if constexpr(std::is_same_v<T, float>){
            return ^^outer::inner::B;
        }else {
            return ^^outer::inner::inner::C;
        }
    };

    // 继承了A
    struct Haha : public [: get_base((int)1) :] {};

    //// 类型，函数，misc ////
    // 可以包装全局变量
    constexpr auto out = ^^aout; 
    constexpr auto prt1 = ^^std::cout;
    // 可以包装函数
    // 但是对于函数，这么写不行，你需要先using,constexpr auto prt2 = ^^std::printf;
    // 原因可能是^^优先级比 :: 高？然而你也不能加括号，这里可能是一个小的使用问题
    using std::printf;
    constexpr auto prt = ^^printf;

    // 可以展开为类型
    std::vector<typename [: a_info :]> vec;

    [: out :] << "Hello Reflection." << fls;
    [: prt1 :] << "Hello Reflection2." << std::endl;
    [: prt :]("Hello Reflection3.\n");

    // 还有更多等待你的探索
}

```

## \<meta\>
讲了核心的语法特性，那么接下来要介绍的就是支撑这个语法特性的核心库了，由于\<meta\>很复杂，因此这里只讲基础内容，够用就行，更深入的内容请自行探索。

### 前置步骤
#### 使用\<meta\>
要使用\<meta\>，你需要
```cpp
#include <meta>

// using namespace std::meta;
// using meta = std::meta;

std::meta::xxx xxx;
```
#### 关于异常
\<meta\>中部分函数可能会throw std::meta::exception(...),这会终止编译过程，一般建议使用predicate先判断，或者使用try-catch,注意try catch要为静态版本的try-catch。

静态版本的try-catch语法上与原本的一致，但是要求其上下文必须是constexpr/consteval的，如果你直接在main函数里面使用：
```cpp
int main(){
    try{
        constexpr auto a = ^^int;
    }catch(std::meta::exception e){}
}
```
你就会遇到这个莫名其妙的错误。
```txt
[build] ./main.cpp:10:33: note: add ‘constexpr’
[build] ./main.cpp:10:6: error: consteval-only expressions are only allowed in a constant-evaluated context
[build]    10 |     }catch(std::meta::exception e){
```
因此这里你需要包装一下:
```cpp
int main(){
        []() constexpr { // 也可以是consteval
        try{
            constexpr auto a = ^^input;
        }catch(std::meta::exception e){}
    }();
}
```
但是这样你就丧失了运行时的交互了，比如这里：
```cpp
int main(){
    struct{
        int a;
    } a;

    [](auto && input) constexpr {
        try{
            constexpr auto a = ^^input;
            constexpr auto b = ^^std::decay_t<typename [: std::meta::type_of(a) :]>::a;

            // 下面的产生了运行时交互，因此会编译失败
            // input.[: b :] += 1;
        }catch(std::meta::exception e){}
    }(a);
}
```

### 断言(predicate) : 比concept更加直接的判断方式
断言可以判断一个info是否具有某种特定的属性，按照其与其他函数的搭配以及返回值来看一般不会返回异常。
这是常用的断言,签名均为"consteval bool xxx(std::meta::info);"

#### 类访问权限
适用于类里面的成员，其他输入返回false。

例子：
```cpp
int main(){
    A a;

    if constexpr(std::meta::is_public(...)){
        std::cout << "Public" << std::endl;
    }else{
        std::cout << "Not Public?" << std::endl;
    }
}

... = ^^A    :  Not Public?
... = ^^a    :  Not Public?
... = ^^A::a :  Public
```

函数：
- is_public 是否为公开函数
- is_protected 是否为同命名空间内可访问函数
- is_private 是否为私有函数

#### 类内部函数的特征
适用于类里面的函数，不适用于全局函数，命名空间内的函数，这类情况返回false。

这里需要注意的是：
- pure virtual函数一定是virtual，所以如果你要排除pure virtual需要is_virtual & !is_pure_virtual。
- is_final也可以用来对final类进行判定，但是对于final的类A， is_final(^^A)为true, is_final(^^A::func)不一定为true，反之亦然

函数：
- is_virtual 是否为虚函数
- is_pure_virtual 是否为纯虚函数
- is_override 是否为override函数
- is_final 是否是禁止重载的函数/类

#### 
同样也是对成员函数进行判定，不过noexcept可以对全局函数/命名空间内的函数进行判定

函数：
- is_deleted
- is_defaulted
- is_user_provided
- is_user_declared
- is_explicit
- is_noexcept
