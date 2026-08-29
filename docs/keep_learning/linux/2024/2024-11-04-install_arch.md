---
title: 在主盘上安装ArchLinux
date: 2024-11-04
transcribe_at: 2026-08-26
tags: [Linux]
category: coding
desc: 在主盘上折腾ArchLinux
highlight: false
---

# 在主盘上安装ArchLinux

<np>
电脑上那块128G主盘上原本安装的是Win10(我三个月前重装的)，虽说我对其进行了一定的“优化”让我使用 Windows的手感还行，但其流畅度甚至打不过我通过外接SSD启动的ArchLinux。而我最近一个月都没有心思去玩3C3U(意味着我不需要启动LiquidBounce进而去使用Windows)，加上Steam上的游戏我也不怎么想玩......各种因素及加起来致使我已经一个月未进入主机的Windows了。
</np>

<np>
既然如此，为何不再主机上干脆使用Linux呢？
</np>

<np>
于是我接上半年未用的Ventoy盘，启动archlinux ISO，使用iwctl和dhcpcd配置网络，然后换上ustc的源，启动archinstall......装到plasma时给我说某个包的密钥有问题，我便终止了安装，使用arch-chroot进入了系统后，我不信邪，主动写：
</np>

```bash
pacman -S plasma
```

<np>
这过这次那两个包又安装成功了。
</np>

<np>
我欣喜若狂，像个傻逼一样在chroot界面下了一堆包，包括java8~23，结果我开机并在sddm上输入密码后......没有任何session被启动，sddm直接终止后重启。
</np>

<np>
我试了好久好久，给plasma重装了N次，还是进不去系统。行吧！重装......
</np>

<np>
结果我又在plasma安装时遇到了安装evxxx库问题，然后我自己静了静，想了想为什么会出现这种NT事情。一会儿后，我发现了令人毛骨悚然的事实：
</np>

<np>
我的archiso是一月份的，但是现在已经是11月了。我没更新archlinux-keyring😱，oh my God!
</np>

<np>
我立马输入:
</np>

```bash
pacman -S archlinux-keyring
```

<np>
再用archlinux安装时直接成功。Ahhhh! 我的10G流量，4个小时竟因为这个小小的keyring而没了。后面也是直接安装成功好吧。
</np>

<np>
成功后，我现安装了openjdk:
</np>

- jdk-openjdk（目前为23.0.1） 
- jdk{8,11,17,21}-openjdk

又从SSD搬过来了ClashForWindows(Linux版)，安装好了fcitx5:

- fcitx5{,-im,-chinese-addons,-config} 

并在plasma的env上加入了下面的批处理代码：

```bash
export SDL_IM_MODULE=fcitx5
export QT_IM_MODULE=fcitx5
export XMODIFIERS=@im=fcitx5
```

<np>
... 再在KDE的虚拟键盘中启用了fcitx5-launcher。 OK，大功告成！
</np>

<np>
之后便是配置VPN，非控制台上的配置比较简单，直接KDE代理设置中填写127.0.0.1:7890即可。面对控制台，我则抄了之前自己写的proxy_on和proxy_off两个脚本，里面为：
</np>

```bash
set http_proxy="127.0.0.1:7890"
set https......
```

<np>
开始我还以为我成功了，直到我手动构建yaya而非从archlinuxcn上下载时。go下x/term下了一坤年我便起了疑心。 echo $http_proxy 一看，呵，空的！
</np>

<np>
原来......脚本执行的export/set并不会继承，我在bash_profile里定义了两个alias : proxy_on 和 proxy_off。 proxy_on的值是从clash的控制台直接复制的，代码类似：
</np>

```bash
alias proxy_on = "export http_proxy=127.0.0.1:%mixedPort%;export https_proxy=127.0.0.1:%mixedPort%;export all_proxy=127.0.0.1:%mixedPort%"

alias proxy_off = "unset http_proxy; unset https_proxy; unset all_proxy"
```

<np>
接着我再配置nvim（直接下载别人的config），嘎嘎快！后面我使用paru与pacman安装了一点软件：
</np>

- visual-studio-code-bin <sup>aur</sup>
- steam <span class="ps">（试了好久还是无法运行，之后看搞一个内置的steamos看行不行）</span>
- codeblocks
- wine
- yesplaymusic <sup>aur</sup>
- nerd-fonts <span class="ps">（这个我装多了......其实只要装一个hacker就行了，但是我全部安装了，占用了8Gb空间）</span>
- linuxqq <sup>aur</sup>
- obs_studio

::: leave
Cheers! <br/>
2024/11/04
:::