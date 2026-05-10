# Urban — Digital Twin Command Center

CARLA 数字孪生城市指挥中心前端。

## 技术栈

- Vite 5 + React 18 + TypeScript
- Tailwind CSS 3 + 设计 token
- Zustand (状态) · Framer Motion (动效) · Phosphor Icons
- Socket.IO Client (规划中)

## 启动

```bash
npm install
npm run dev
```

默认端口 5173。后端代理:
- `/api` → `http://localhost:5000`
- `/video_feed` → MJPEG (Flask)
- `/socket.io` → WebSocket 状态推送

## 目录

```
src/
├─ components/
│  ├─ primitives/    Panel · Button · Input · Stat · Badge · NumberFlow · StatusDot
│  ├─ layout/        Header · Footer
│  ├─ feeds/         AerialFeed · GroundFeed · CityBirdView · PlaceholderScene
│  ├─ system/        FleetStatus · Telemetry
│  └─ command/       CommandPanel
├─ store/            useMockStore (M1) → 后续替换为 telemetry / system / command stores
├─ types/            数据契约
├─ lib/              cn (clsx + tailwind-merge)
├─ styles/           globals.css (设计 token + Tailwind)
└─ main.tsx
```

## 路线图

- [x] **M1** 工程基建 + 视觉系统 + 静态原型 (mock)
- [ ] **M2** Socket.IO 接入,真实 telemetry / 系统监控
- [ ] **M3** MJPEG / WebRTC 视频流
- [ ] **M4** 键盘快捷键,虚拟滚动,错误边界
- [ ] **M5** Docker + GH Actions

## 设计原则

1. 去 sci-fi tells:无扫描线 / 霓虹辉光 / 十字准星 / Orbitron 字体
2. 单色调主导 + 一个克制的强调色 (electric blue)
3. 层次靠间距和明度,不靠边框和颜色
4. 数字用 Tabular Numerals,翻牌动效
5. 过渡曲线统一 `cubic-bezier(0.32, 0.72, 0, 1)`,时长 140 / 240 / 360ms
