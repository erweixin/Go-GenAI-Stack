import { RouterProvider } from 'react-router-dom'
import { router } from './router'

/**
 * App 主组件
 * 
 * 使用 React Router v7 的数据路由模式
 * 路由配置见 src/router/index.tsx
 */
function App() {
  return <RouterProvider router={router} />
}

export default App

