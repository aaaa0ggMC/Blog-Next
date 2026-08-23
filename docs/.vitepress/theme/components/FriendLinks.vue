<template>
  <div class="friend-links-container">
    <!-- 友链卡片网格 -->
    <div class="friends-grid">
      <a
        v-for="friend in friendList"
        :key="friend.url"
        :href="friend.url"
        target="_blank"
        rel="noopener noreferrer"
        class="friend-card"
      >
        <div class="card-top">
          <!-- 头像区域 -->
          <div class="avatar-wrap">
            <img
              v-if="friend.avatar"
              :src="friend.avatar"
              :alt="friend.name"
              class="friend-avatar"
              @error="onAvatarError($event, friend.name)"
            />
            <div v-else class="avatar-placeholder">
              {{ getInitials(friend.name) }}
            </div>
          </div>

          <!-- 名字与标识 -->
          <div class="meta-wrap">
            <div class="name-row">
              <span class="friend-name">{{ friend.name }}</span>
              <span v-if="friend.alias" class="friend-alias">{{ friend.alias }}</span>
            </div>
            <div class="tag-row" v-if="friend.tag">
              <span class="friend-tag">{{ friend.tag }}</span>
            </div>
          </div>

          <!-- 外链箭头图标 -->
          <div class="external-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </div>
        </div>

        <!-- 介绍 / Motto -->
        <div class="card-body">
          <p class="friend-desc" :title="friend.desc">
            {{ friend.desc || '这个人很神秘，什么都没有写...' }}
          </p>
        </div>

        <!-- 底部网址展示 -->
        <div class="card-footer">
          <span class="site-link">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span class="link-text">{{ cleanUrl(friend.url) }}</span>
          </span>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface FriendItem {
  name: string
  alias?: string
  url: string
  avatar?: string
  desc?: string
  tag?: string
}

const props = defineProps<{
  friends?: FriendItem[]
}>()

// 默认友链数据
const defaultFriends: FriendItem[] = [
  {
    name: '一秋落木',
    alias: 'euuen',
    url: 'https://euuen.github.io/',
    avatar: 'https://github.com/euuen.png',
    desc: '不争不抢，平淡生活，积极贡献，努力发光',
    tag: '好朋友',
  },
]

const friendList = computed(() => {
  return props.friends && props.friends.length > 0 ? props.friends : defaultFriends
})

function getInitials(name: string): string {
  if (!name) return '友'
  return name.trim().slice(0, 1)
}

function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function onAvatarError(e: Event, name: string) {
  const target = e.target as HTMLImageElement
  if (target) {
    target.style.display = 'none'
    const parent = target.parentElement
    if (parent && !parent.querySelector('.avatar-placeholder')) {
      const div = document.createElement('div')
      div.className = 'avatar-placeholder'
      div.innerText = getInitials(name)
      parent.appendChild(div)
    }
  }
}
</script>

<style scoped>
.friend-links-container {
  margin: 20px 0 36px;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.friend-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  color: inherit;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

.friend-card:hover {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-bg-elv);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

/* 头像 */
.avatar-wrap {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.friend-card:hover .avatar-wrap {
  border-color: var(--vp-c-brand);
  transform: scale(1.05);
}

.friend-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--vp-c-brand);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}

/* 信息区 */
.meta-wrap {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.friend-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  transition: color 0.2s ease;
}

.friend-card:hover .friend-name {
  color: var(--vp-c-brand);
}

.friend-alias {
  font-size: 11px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
}

.tag-row {
  margin-top: 4px;
}

.friend-tag {
  display: inline-block;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.12);
  color: var(--vp-c-brand);
  border: 1px solid rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.25);
}

/* 外链图标 */
.external-icon {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
  opacity: 0.6;
  transition: all 0.2s ease;
  margin-top: 2px;
}

.friend-card:hover .external-icon {
  color: var(--vp-c-brand);
  opacity: 1;
  transform: translate(2px, -2px);
}

/* 描述 */
.card-body {
  margin: 12px 0 10px;
}

.friend-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 底部网址 */
.card-footer {
  display: flex;
  align-items: center;
  padding-top: 8px;
  border-top: 1px dashed var(--vp-c-divider);
}

.site-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

.link-text {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .friends-grid {
    grid-template-columns: 1fr;
  }
}
</style>
