import {Link, useHistory} from 'react-router-dom'
import {Card, Breadcrumb, Form, Button, Radio, DatePicker, Space, Table, Tag, Modal} from 'antd'
import {useDispatch, useSelector} from "react-redux";
import {useEffect, useRef} from "react";
import {delArticleAction, getArticleAction} from "@/store/actions/article";
import {EditOutlined, DeleteOutlined, WarningOutlined} from "@ant-design/icons";
import img404 from '@/assets/error.png'
import Channel from "@/components/channel";
// import 'moment/locale/zh-cn'
// import dayjs from 'dayjs'
// import locale from "antd/es/date-picker/locale/zh_CN";
// dayjs.locale('zh-cn');

const {RangePicker} = DatePicker
// 优化文章状态的处理(不变的)=》映射关系
const articleStatus = {
    0: {color: 'yellow', text: '草稿'},
    1: {color: '#ccc', text: '待审核'},
    2: {color: 'green', text: '审核通过'},
    3: {color: 'red', text: '审核失败'}
}

function Article() {

    //1.获取文章频道列表数据
    const dispatch = useDispatch()
    const history = useHistory()
    const {list, total, page, pageSize} = useSelector(state => state.article)
    useEffect(() => {
        // dispatch(getChannelAction())
        //2.获取文章列表数据=》默认第一次调用，不需要顾虑参数
        dispatch(getArticleAction({}))
    }, [dispatch])


    //table列表每列数据定义
    // const columns = [
    //     {
    //         title: '姓名',//列的标题
    //         dataIndex: 'name',//对应data数据源中的属性名（唯一）
    //         // 自定义列的内容
    //         /**
    //          *
    //          * @param col   当前列的值
    //          * @param row   当前行的数据
    //          * @param i 行的索引
    //          */
    //         render: (col, row, i) => {
    //             // console.log(col, row, i)
    //             return <span style={{color: 'red'}}>{col}</span>
    //         }
    //     },
    // ];
    // table列表数据源(从后台获取)

    //删除文章
    /**
     *
     * @param article 文章数据
     */
    const delArticle = (article) => {
        Modal.confirm({
            title: '提示', content: `确认删除:【${article.title}】吗?`, icon: <WarningOutlined/>,
            onOk() {
                //需要传递:1.文章id(删除文章接口需要) 2.过滤条件数据(刷新列表重新获取列表需要)
                dispatch(delArticleAction(article.id, filters.current))
            }
        })
    }
    //table表格列
    const columns = [
        {
            title: '封面',
            dataIndex: 'cover',
            render: cover => {
                return <img src={cover || img404} width={200} height={150} alt=""/>
            }
        },
        {
            title: '标题',
            dataIndex: 'title',
            width: 220
        },
        {
            title: '状态',
            dataIndex: 'status',
            render: status => {
                //根据status文章状态=》articleStatus[status]获取映射关系对应的状态
                return <Tag color={articleStatus[status].color}>{articleStatus[status].text}</Tag>
            }
        },
        {
            title: '发布时间',
            dataIndex: 'pubdate'
        },
        {
            title: '阅读数',
            dataIndex: 'read_count'
        },
        {
            title: '评论数',
            dataIndex: 'comment_count'
        },
        {
            title: '点赞数',
            dataIndex: 'like_count'
        },
        {
            title: '操作',
            render: data => {
                return (
                    <Space size="middle">
                        {/*修改文章*/}
                        <Button onClick={() => {
                            history.push(`/home/publish/${data.id}`)
                        }} type="primary" shape="circle" icon={<EditOutlined/>}/>
                        {/*删除文章*/}
                        <Button
                            type="primary"
                            danger
                            shape="circle"
                            onClick={() => delArticle(data)}
                            icon={<DeleteOutlined/>}
                        />
                    </Space>
                )
            }
        }
    ]
    //table列表数据源(从后台获取)
    // const data = [
    //     {
    //         id: '8218',
    //         comment_count: 0,
    //         cover: 'http://geek.itheima.net/resources/images/15.jpg',
    //         like_count: 0,
    //         pubdate: '2019-03-11 09:00:00',
    //         read_count: 2,
    //         status: 2,
    //         title: 'webview离线化加载h5资源解决方案'
    //     }
    // ]

    //3.根据表单选择的条件过滤文章列表

    /**
     *表单数据
     * @param status
     * @param channel_id
     * @param date
     */
        // let filters = {}
        //使用useRef记录过滤条件
    const filters = useRef({})
    const onFilter = ({status, channel_id, date}) => {
        console.log(status, channel_id, date)
        //组装过滤列表需要的参数
        const params = {channel_id}
        //排除全部
        if (status !== -1) {
            params.status = status
        }
        //判断一个值是否是  '' null undefined
        if (!!date) {
            //开始时间
            params.begin_pubdate = date[0].format('YYYY-MM-DD HH:mm:ss')
            //结束时间
            params.end_pubdate = date[1].format('YYYY-MM-DD HH:mm:ss')
        }
        //存储过滤条件params？
        // filters = params
        filters.current = params
        dispatch(getArticleAction(params))
    }

    //文章列表切换分页事件
    /**
     *
     * @param page  最新页码
     * @param pageSize  最新每页条数
     */
    const onPageChange = (page, pageSize) => {
        const params = {
            page,
            per_page: pageSize,
            //加上过滤条件数据
            ...filters.current

        }
        //根据最新分页数据刷新列表
        dispatch(getArticleAction(params))
    }
    return (
        <>
            {/*筛选表单*/}
            <Card
                title={
                    <Breadcrumb separator=">">
                        <Breadcrumb.Item>
                            <Link to="/home">首页</Link>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>内容管理</Breadcrumb.Item>
                    </Breadcrumb>
                }
                style={{marginBottom: 20}}
            >
                <Form onFinish={onFilter} initialValues={{status: -1}}>
                    <Form.Item label="状态" name="status">
                        <Radio.Group>
                            <Radio value={-1}>全部</Radio>
                            <Radio value={0}>草稿</Radio>
                            <Radio value={1}>待审核</Radio>
                            <Radio value={2}>审核通过</Radio>
                            <Radio value={3}>审核失败</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item label="频道" name="channel_id">
                        {/*文章频道选择*/}
                        <Channel/>
                    </Form.Item>

                    <Form.Item label="日期" name="date">
                        <RangePicker></RangePicker>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            筛选
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
            <Card title={`根据筛选条件获取到${total}条数据：`}>
                <Table
                    rowKey='id'
                    columns={columns}
                    dataSource={list}
                    pagination={{
                        position: ['bottomCenter'],
                        current: page,//当前第几页
                        pageSize,//每页多少条数据
                        total,//总数
                        showSizeChanger: true,//切换页容量
                        onChange: onPageChange//页码或pageSize改变的回调
                    }}>
                </Table>
            </Card>
        </>
    );
}

export default Article;
