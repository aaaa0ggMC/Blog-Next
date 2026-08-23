---
title: 设置
desc: 网站加密解密密钥的设置页面。
---

# 设置

## 密钥设置
<p class='hl ins'>出于隐私考虑，本站部分内容经过加密：短数据以密文（Base64 / Hex）呈现，长数据则以 GnuPG 加密的文件链接给出。持有私钥或密码即可解密浏览。可解密的数据显示为绿色；若未能解密，默认折叠，点击可展开。</p>

<div class='set-card'>
  <div class='set-row'>
    <div class='set-meta'>
      <span class='set-name'>教师密钥</span>
      <span class='set-desc'>供老师查看</span>
    </div>
    <div class='set-control'>
      <input id='teacher_key' class='ip' type='password' />
      <button class='set-btn' onclick='confirmGPG();narn("success","密钥更新成功",1000,"密钥设置");initGPG();'>确定</button>
    </div>
  </div>
  <div class='set-row'>
    <div class='set-meta'>
      <span class='set-name'>普通密钥</span>
      <span class='set-desc'>给我认为安全的人</span>
    </div>
    <div class='set-control'>
      <input id='gpg_key' class='ip' type='password' />
      <button class='set-btn' onclick='confirmGPG();narn("success","密钥更新成功",1000,"密钥设置");initGPG();'>确定</button>
    </div>
  </div>
  <div class='set-row'>
    <div class='set-meta'>
      <span class='set-name'>SecKey <span class='hl'>[Prompt: BlOg ]</span></span>
      <span class='set-desc'>最隐私的密钥，一般只有我自己知道</span>
    </div>
    <div class='set-control'>
      <input id='sec_key' class='ip' type='password' />
      <button class='set-btn' onclick='confirmGPG();narn("success","密钥更新成功",1000,"密钥设置");initGPG();'>确定</button>
    </div>
  </div>
</div>

### 密钥解码示例
<div class='set-card'>
  <div class='set-ex'>
    <p class='hl'>教师密钥测试：</p>
    <span class='eteacher' fallback='测试失败，不能浏览比较敏感的东西' >XxPeoQDAssRaUE5Jh2ruN98jVqJCJ17aTe8K50//1LGcu6RVHr8SpLUv2zE+thrq8IcyKP+nIHe5wMRuippJ2ow=</span>
  </div>
  <div class='set-ex'>
    <p class='hl'>密钥有效时，你会看到如下内容：</p>
    <span class='encrypt' fallback='很可惜，你对网站的了解深度最高也只有40%了，你将无法查看我提及的人的真实名字、我的学校、地址......' >W4d5NMnofNVHYrFD4vyPmNl0WID+sMTXfrBCFGxbfKDqjzu8qleBCN/x2tP7O8KGzsDBJX8NPyh1HIu3F/D1v3wBvWZw9KOdLs6m5+uR1tYV8wnHbNvGRIHP99deVZsEsUOiTzzmRymtWkKSaLfZGSO0Im+pv9in/UxymgqhuMooKkbqBiWoXjiqzFA=</span>
  </div>
  <div class='set-ex'>
    <p class='hl'>使用更私密的密钥解锁：</p>
    <span class='encpp' fallback='很可惜，你对网站的了解深度还不能达到最深。你将不会了解到我藏起来的东西。Only my hull.' >+UybcpKa4qKVmeaTWDO9HD7HXGTrcW2UJtb97kEXSD+whYofWd+/dCvbBCAIoI0RDRGmY8vJfyQ/hXjhFVLrh4kauSpB2topWi/V1jlJcj6AWXdoNnetbq+LW3u2CGrk6UH4vRnlwEvm0uoqy/XwNRh+LDTy/5ubehK2uFWomQCZkA6Orz9gFJon5bVm+QFWx5UjPNhXHvVpW/XgHkRHATXimNguU5govEkryQ1hYacN5+g=</span>
  </div>
</div>


## 通知设置（右下角弹窗）
<div class='set-card'>
  <div class='set-row'>
    <div class='set-meta'>
      <span class='set-name'>LOG 级别</span>
      <span class='set-desc'>显示普通日志</span>
    </div>
    <div class='set-control'>
      <span class='set-test' onclick='narn("log","测试")'>测试</span>
      <input id='sw_log' class="switch switch-anim" onchange="var fn = function(){narn('success','设置成功');};localStorage.disAllowLog = !checkSwitch(this,fn,fn)" type="checkbox" />
    </div>
  </div>
  <div class='set-row'>
    <div class='set-meta'>
      <span class='set-name'>WARN 级别</span>
      <span class='set-desc'>显示警告</span>
    </div>
    <div class='set-control'>
      <span class='set-test' onclick='narn("warn","测试")'>测试</span>
      <input id='sw_war' class="switch switch-anim" onchange="var fn = function(){narn('success','设置成功');};localStorage.disAllowWarn = !checkSwitch(this,fn,fn)" type="checkbox" />
    </div>
  </div>
  <div class='set-row'>
    <div class='set-meta'>
      <span class='set-name'>SUCCESS 级别</span>
      <span class='set-desc'>显示成功提示</span>
    </div>
    <div class='set-control'>
      <span class='set-test' onclick='narn("success","测试")'>测试</span>
      <input id='sw_suc' class="switch switch-anim" onchange="var fn = function(){narn('success','设置成功');};localStorage.disAllowSuc = !checkSwitch(this,fn,fn)" type="checkbox" />
    </div>
  </div>
  <div class='set-row'>
    <div class='set-meta'>
      <span class='set-name'>ERROR 级别</span>
      <span class='set-desc'>显示错误信息</span>
    </div>
    <div class='set-control'>
      <span class='set-test' onclick='narn("error","测试")'>测试</span>
      <input id='sw_err' class="switch switch-anim" onchange="var fn = function(){narn('success','设置成功');};localStorage.disAllowErr = !checkSwitch(this,fn,fn)" type="checkbox" />
    </div>
  </div>
</div>

## 界面与动效
<div class='set-card'>
  <div class='set-row'>
    <div class='set-meta'>
      <span class='set-name'>主页背景视差</span>
      <span class='set-desc'>主界面背景图片随鼠标移动产生微弱视差偏移</span>
    </div>
    <div class='set-control'>
      <input id='sw_parallax' class="switch switch-anim" onchange="var fn = function(){narn('success','设置成功');};localStorage.enableParallax = checkSwitch(this,fn,fn)" type="checkbox" />
    </div>
  </div>
</div>

## 数据代理
<div class='set-card'>
  <div class='set-row'>
    <div class='set-meta'>
      <span class='set-name'>使用本地资源 (Local Res)</span>
      <span class='set-desc'>使用 docs/public/res 本地资源，本地调试无缝切换（默认使用 Cloudflare R2）</span>
    </div>
    <div class='set-control'>
      <input id='sw_local' class="switch switch-anim" onchange="var fn = function(){narn('success','设置成功');};localStorage.useLocal = checkSwitch(this,fn,fn)" type="checkbox" />
    </div>
  </div>
  <div class='set-row'>
    <div class='set-meta'>
      <span class='set-name'>自定义代理地址</span>
      <span class='set-desc'>用于调试，优先级低于 本地资源、高于 Cloudflare R2</span>
    </div>
    <div class='set-control'>
      <input id='usdf' class='ip' type='text' />
      <button class='set-btn' onclick='localStorage.userDef = document.getElementById("usdf").value;narn("success","地址更新成功",1000,"代理地址设置");'>确定</button>
    </div>
  </div>
</div>


<div id='page_id'>settings</div>
