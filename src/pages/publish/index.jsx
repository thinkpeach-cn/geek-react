import {
    Card,
    Breadcrumb,
    Form,
    Button,
    Radio,
    Input,
    Upload,
    Space, message, Spin,
} from 'antd'
import {PlusOutlined} from '@ant-design/icons'
import {Link, useHistory, useParams} from 'react-router-dom'
import styles from './index.module.scss'
//导入富文本编辑器组件和样式
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css'
import {useEffect, useRef, useState} from "react";
import Channel from "@/components/channel";
import {useDispatch} from "react-redux";
import {addArticleAction} from "@/store/actions/article";
import request from "@/utils/request";

// 编辑状态下，再次点击菜单，表单数据没有清空=>组件缓存:1.组件key 2.手动清空
// 编辑装天下,数据回填的时候=>加入loading效果


const Publish = () => {

    //获取文章Id
    const params = useParams()
    //isEdit：1.true 编辑文章状态 2.false 发布文章状态
    const isEdit = !!params.id
    //1.上传文章封面的实现
    //已上传图片的列表:[{url:'',},{url:''},...]
    const [fileList, setFileList] = useState([])
    const dispatch = useDispatch()
    const history = useHistory()
    //备份fileList=》动态切换单图或多图使用
    const fileListRef = useRef([])

    //处理上传文件列表
    const onUploadChange = (data) => {
        const _fileList = data.fileList.map(file => {
            //1.从本地选择新上传的图片
            //file.response 上传成功之后，后台返回的响应数据
            if (file.response) {
                return {
                    url: file.response.data.url
                }
            }
            //2.操作删除本地已上传图片
            return file
        })
        // 备份
        fileListRef.current = _fileList
        //存储上传图片文件列表
        setFileList(_fileList)
    }

    //2.控制图片封面上传的数量
    const [maxCount, setMaxCount] = useState(1)
    const changeType = (e) => {
        const count = e.target.value
        setMaxCount(count)
        //3.处理单图和多图的动态切换
        if (count === 1) {
            //从备份数据中获取第一张
            const firstImg = fileListRef.current[0]
            //1.可能一张图片都没有上传 2.可能上传1~3
            setFileList(!firstImg ? [] : [firstImg])
        } else if (count === 3) {
            setFileList(fileListRef.current)
        }
    }

    //4.发布文章=》获取表单数据
    //公共方法:发布文章(1.正式发布 2.存为草稿)
    /**
     *
     * @param formData  表单数据
     * @param isDraft   是否是草稿状态:true 草稿 | false 正式文章
     */
    const publishArticle = async (formData, isDraft) => {
        /*
        * 1.校验文章封面图片
        * 2.准备发布文章后台需要的数据
        *
        * */
        const {type, ...rest} = formData
        if (formData.type !== fileList.length) {
            return message.error('封面数量和上传图片数量不一致!')
        }
        //组装后台需要的数据
        const data = {
            ...rest,
            //文章封面图片=>images:['url1','url2',...]
            cover: {type, images: fileList.map(item => item.url)}
        }
        //判断如果是编辑状态，把文章ID存到data上
        if (isEdit) {
            data.id = params.id
        }
        /*
        * 发布文章使用dispatch还是直接发请求?
        * 1.在页面直接发请求(后台请求封装到api目录)
        * 2.在页面使用dispatch(结合redux的方式)
        * */
        try {
            await dispatch(addArticleAction(data, isDraft, isEdit))
            const editTxt = isEdit ? '编辑' : '发布'
            message.success(!isDraft ? `${editTxt}成功!` : '存储成功!')
            history.push('/home/article')

        } catch (error) {
            console.log(error)
        }
    }
    //5.存入草稿
    // 获取表单实例
    const [form] = Form.useForm()
    const saveDraft = async () => {
        console.log('表单控制实例', form)
        //通过form的validates校验表单
        try {
            const formData = await form.validateFields()
            //校验通过走到这里
            publishArticle(formData, true)

        } catch (e) {
            //校验不通过走到这里
            console.log(e)
        }
    }

    //6.编辑状态=>根据文章ID获取文章数据,进行回填
    // 添加loading效果
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        /*
        * 1.判断是否是编辑状态
        * 2.如果是进行=》根据文章ID获取文章数据,进行回填
        *
        * */
        const getDetail = async () => {
            if (!isEdit) return setLoading(false)
            //是编辑状态
            const {data} = await request.get(`/v1_0/mp/articles/${params.id}`)
            // 处理后台返回的数据，进行数据回填
            const {title, content, channel_id, cover: {type, images}} = data
            //组装表单回填需要的数据
            const formData = {type, title, content, channel_id,}
            //1.表单数据回填
            form.setFieldsValue(formData)
            //2.回填文章的封面图片列表
            const imgList = images.map(item => ({url: item}))
            setFileList(imgList)
            //备份图片列表
            fileListRef.current = imgList
            //最大可上传图片数量
            setMaxCount(type)
            //关闭loading遮罩
            setLoading(false)
        }
        getDetail()
    }, [isEdit, params.id, form])

    const onFinish = (formData) => {
        console.log('校验通过', formData)
        //发布文章
        publishArticle(formData, false)
    }

    return (
        <div className={styles.root}>
            <Spin tip='正在加载中...' spinning={loading}>
                <Card
                    title={
                        <Breadcrumb separator=">">
                            <Breadcrumb.Item>
                                <Link to="/home">首页</Link>
                            </Breadcrumb.Item>
                            <Breadcrumb.Item>{!isEdit ? '发布文章' : '编辑文章'}</Breadcrumb.Item>
                        </Breadcrumb>
                    }
                >
                    <Form
                        form={form}
                        onFinish={onFinish}
                        // 表单左侧文字控制宽度
                        labelCol={{span: 4}}
                        //表单项宽度控制
                        wrapperCol={{span: 16}}
                        //表单化的默认值
                        initialValues={{type: 1}}
                    >
                        <Form.Item
                            label="标题"
                            name="title"
                            rules={[{required: true, message: '请输入文章标题'}]}
                        >
                            <Input placeholder="请输入文章标题" style={{width: 400}}/>
                        </Form.Item>
                        <Form.Item
                            label="频道"
                            name="channel_id"
                            rules={[{required: true, message: '请选择文章频道'}]}
                        >
                            {/*<Select placeholder="请选择文章频道" style={{width: 400}}>*/}
                            {/*    <Option value={0}>推荐</Option>*/}
                            {/*</Select>*/}
                            <Channel/>
                        </Form.Item>

                        <Form.Item label="封面">
                            <Form.Item name="type">
                                <Radio.Group onChange={changeType}>
                                    <Radio value={1}>单图</Radio>
                                    <Radio value={3}>三图</Radio>
                                    <Radio value={0}>无图</Radio>
                                    {/* <Radio value={-1}>自动</Radio> */}
                                </Radio.Group>
                            </Form.Item>
                            {/* Upload 组件说明：*/}
                            {
                                maxCount > 0 && <Upload
                                    maxCount={maxCount}// 控制上传图片的数量
                                    multiple={maxCount > 1} // 多选
                                    className="avatar-uploader"
                                    // 发到后台的文件参数名
                                    // 必须指定，根据接口文档的说明，需要设置为 image
                                    name="image"
                                    // 上传组件展示方式
                                    listType="picture-card"
                                    // 展示已上传图片列表
                                    showUploadList
                                    // 接口地址
                                    // 注意：Upload 再上传图片时，默认不会执行 axios 的请求，所以，此处需要手动设置完整接口地址
                                    action="http://geek.itheima.net/v1_0/upload"

                                    // 已经上传的文件列表，设置该属性后组件变为 受控
                                    fileList={fileList}
                                    // 上传文件改变/本地已上传文件修改的时候的回调
                                    onChange={onUploadChange}
                                >
                                    <div style={{marginTop: 8}}>
                                        <PlusOutlined/>
                                    </div>
                                </Upload>
                            }
                        </Form.Item>
                        <Form.Item
                            label="内容"
                            name="content"
                            rules={[{required: true, message: '请输入文章内容'}]}
                        >
                            {/*富文本呢编辑器=>需要给默认值*/}
                            <ReactQuill/>
                        </Form.Item>
                        <Form.Item wrapperCol={{offset: 4}}>
                            <Space>
                                <Button size="large" type="primary" htmlType="submit">
                                    {!isEdit ? '发布文章' : '编辑文章'}
                                </Button>
                                <Button onClick={saveDraft} size="large">存入草稿</Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </Spin>
        </div>
    )
}

export default Publish
