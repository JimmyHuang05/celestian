import { Link, NavLink, Outlet } from 'react-router-dom'
import './mapplus-workbench.css'

export default function MapPlusWorkbench() {
  return (
    <div className="mapplus-workbench">
      <header className="mapplus-workbench-bar">
        <span>MapPlus 工作台</span>
        <nav aria-label="MapPlus 编辑工具">
          <NavLink to="/mapplus/migrate">迁移</NavLink>
          <NavLink to="/mapplus/paint">涂色</NavLink>
          {import.meta.env.DEV && <NavLink to="/mapplus/copy">文案</NavLink>}
        </nav>
        {import.meta.env.DEV && <a className="mapplus-workbench-start" href="celestian-preview://start">启动本地服务</a>}
        <Link className="mapplus-workbench-back" to="/mapplus">返回地图</Link>
      </header>
      <div className="mapplus-workbench-editor"><Outlet /></div>
    </div>
  )
}
