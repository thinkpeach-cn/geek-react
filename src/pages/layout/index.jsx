import {Layout, Menu, Popconfirm} from 'antd'
import {HomeOutlined, DiffOutlined, EditOutlined, LogoutOutlined} from '@ant-design/icons'
// 导入组件样式
import styles from './index.module.scss'
//导入三个子路由页面
// import Home from "@/pages/home";
// import Article from "@/pages/article";
// import Publish from "@/pages/publish";


import {Route, Link, useLocation, useHistory, Switch} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {lazy, useEffect} from "react";
import {getUserAction} from "@/store/actions/user";
import {logoutAction} from "@/store/actions/login";
// import NotFound from "@/pages/404";
//结构Layout组件上的静态属性=》函数组件
const {Header, Sider} = Layout

//路由的懒加载
const Home = lazy(() => import( "@/pages/home"))
const Article = lazy(() => import( "@/pages/article"))
const Publish = lazy(() => import( "@/pages/publish"))
const NotFound = lazy(() => import( "@/pages/404"))

const Layouts = () => {
    /*
    * 1.实现菜单高亮:
    *   1>.把菜单绑定的key值，变为对应菜单的路由path地址
    *   2>.定义当前访问页面的path地址变量=>当前菜单需要高亮的路由地址
    * */

    const location = useLocation()
    //当选选中的菜单
    const currSelected = location.pathname.startsWith('/home/publish') ? '/home/publish' : location.pathname
    //2.获取登录人的信息存到redux
    const dispatch = useDispatch()

    const user = useSelector((state) => state.user)

    useEffect(() => {
        dispatch(getUserAction())
    }, [dispatch])

    //3.退出登录
    const history = useHistory()
    const onLogout = () => {
        console.log('执行退出')
        /*
        * 1.清除redux状态数据和本地token
        * 2.跳回登录页
        * */
        dispatch(logoutAction())
        history.replace('/login')
    }

    //每次路由切换页面，执行滚动回顶

    document.querySelector('.scrollBox') && (document.querySelector('.scrollBox').scrollTop = 0)

    return (
        <Layout className={styles.root}>
            {/*顶部通栏*/}
            <Header className="header">
                {/*左侧:系统logo*/}
                <div className="logo"/>
                {/* 右侧：用户信息 */}
                <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="user-logout">
                        <Popconfirm title="是否确认退出？" onConfirm={onLogout} okText="退出" cancelText="取消">
                            <LogoutOutlined/> 退出
                        </Popconfirm>
                    </span>
                </div>
            </Header>
            {/*左侧:菜单*/}
            <Layout>
                <Sider width={200} className="site-layout-background">
                    <Menu
                        mode="inline"
                        theme="dark"
                        //控制选中的菜单,值是Menu.Item上的key值
                        // defaultSelectedKeys={[currSelected]}
                        selectedKeys={[currSelected]}
                        style={{height: '100%', borderRight: 0}}
                    >
                        <Menu.Item icon={<HomeOutlined/>} key="/home">
                            <Link to='/home'>数据概览</Link>
                        </Menu.Item>
                        <Menu.Item icon={<DiffOutlined/>} key="/home/article">
                            <Link to='/home/article'>内容管理</Link>
                        </Menu.Item>
                        <Menu.Item icon={<EditOutlined/>} key="/home/publish">
                            <Link to='/home/publish'>发布文章</Link>
                        </Menu.Item>
                    </Menu>
                </Sider>
                {/*右侧：内容*/}
                <Layout className="scrollBox" style={{padding: 20, overflowY: 'auto'}}>
                    {/*配置子路由*/}
                    <Switch>
                        <Route exact path='/home' component={Home}/>
                        <Route path='/home/article' component={Article}/>
                        {/*1.发布文章(不带ID参数) 2.修改文章(带ID参数)=》:id?   '?'：意思是参数是可选的*/}
                        <Route key={Date.now()} path='/home/publish/:id?' component={Publish}/>
                        <Route component={NotFound}/>
                    </Switch>
                </Layout>
            </Layout>
        </Layout>
    )
}

export default Layouts
