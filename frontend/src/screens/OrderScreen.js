import React, { useState, useEffect } from 'react'
import { Button, Row, Col, ListGroup, Image, Card, Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { PayPalButton } from 'react-paypal-button-v2'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { listProductDetails, createProductReview } from '../actions/productActions'
import { getOrderDetails, payOrder, deliverOrder, createPayTransaction } from '../actions/orderActions'
import { ORDER_PAY_RESET, ORDER_DELIVER_RESET, ORDER_PAY_MOBILE_RESET } from '../constants/orderConstants'

function OrderScreen({ match, history }) {
    const orderId = match.params.id
    const dispatch = useDispatch()


    const [sdkReady, setSdkReady] = useState(false)
    const [bank, setBank] = useState('')
    const [transactionno, setTransactionNo] = useState('')

    const orderDetails = useSelector(state => state.orderDetails)
    const { order, error, loading } = orderDetails

    const orderPay = useSelector(state => state.orderPay)
    const { loading: loadingPay, success: successPay } = orderPay

    const orderDeliver = useSelector(state => state.orderDeliver)
    const { loading: loadingDeliver, success: successDeliver } = orderDeliver

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    const orderPayMobile = useSelector(state => state.orderPayMobile)
    const {
        loading: loadingPayMobile,
        error: errorPayMobile,
        success: successPayMobile,
    } = orderPayMobile


    if (!loading && !error) {
        order.itemsPrice = order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0).toFixed(2)
    }


    const addPayPalScript = () => {
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = 'https://www.paypal.com/sdk/js?client-id=AfRQ5FBlc9Fm53_egesyZaRai--mwgAR7HjDhi4EpRfRWsFKdrWRfzZMFyg3f0CIRB6oOcSJDRuqPAw1'
        script.async = true
        script.onload = () => {
            setSdkReady(true)
        }
        document.body.appendChild(script)
    }

    useEffect(() => {

        if (!userInfo) {
            history.push('/login')
        }

        if (!order || successPay || successPayMobile || order._id !== Number(orderId) || successDeliver) {
            dispatch({ type: ORDER_PAY_RESET })
            dispatch({ type: ORDER_PAY_MOBILE_RESET })
            dispatch({ type: ORDER_DELIVER_RESET })

            dispatch(getOrderDetails(orderId))
        } else if (!order.isPaid) {
            if (!window.paypal) {
                addPayPalScript()
            } else {
                setSdkReady(true)
            }
        }
    }, [dispatch, order, orderId, successPay, successDeliver])

    const successPaymentHandler = (paymentResult) => {           
        dispatch(payOrder(orderId, {"status": "COMPLETED"})) //{"status": "COMPLETED"}
    }  

    const deliverHandler = () => {
        dispatch(deliverOrder(order))
    }

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(createPayTransaction(
            match.params.id, {
            bank,
            transactionno
        }
        ))
    }

    return loading ? (
        <Loader />
    ) : error ? (
        <Message variant='danger'>{error}</Message>
    ) : (
                <div>
                    <h1>Order: {order.Id}</h1>
                    <Row>
                        <Col md={8}>
                            <ListGroup variant='flush'>
                                <ListGroup.Item>
                                    <h2>Shipping</h2>
                                    <p><strong>Name: </strong> {order.user.name}</p>
                                    <p><strong>Email: </strong><a href={`mailto:${order.user.email}`}>{order.user.email}</a></p>
                                    <p>
                                        <strong>Shipping: </strong>
                                        {order.shippingAddress.address},  {order.shippingAddress.city}
                                        {',  '}
                                        {order.shippingAddress.postalCode},
                                {'  '}
                                        {order.shippingAddress.country}
                                    </p>
                                    
                                    {order.isDelivered ? (
                                        <Message variant='success'>Delivered on {order.deliveredAt.substring(0, 10)}</Message>
                                    ) : (
                                            <Message variant='warning'>Not Delivered</Message>
                                        )}
                                </ListGroup.Item>

                                <ListGroup.Item>
                                    <h2>Payment Method</h2>
                                    <p>
                                        <strong>Method: </strong>
                                        {order.paymentMethod}
                                    </p>
                                    
                                    {order.isPaid ? (
                                        
                                        <Message variant='success'>Paid on {order.paidAt.substring(0, 10)}</Message>
                                    ) : (
                                            <Message variant='warning'>Not Paid</Message>
                                        )}

                                </ListGroup.Item>

                                <ListGroup.Item>
                                    <h2>Order Items</h2>
                                    {order.orderItems.length === 0 ? <Message variant='info'>
                                        Order is empty
                            </Message> : (
                                            <ListGroup variant='flush'>
                                                {order.orderItems.map((item, index) => (
                                                    <ListGroup.Item key={index}>
                                                        <Row>
                                                            <Col md={1}>
                                                                <Image src={item.image} alt={item.name} fluid rounded />
                                                            </Col>

                                                            <Col>
                                                                <Link to={`/product/${item.product}`}>{item.name}</Link>
                                                            </Col>

                                                            <Col md={4}>
                                                                {item.qty} X Nu.{item.price} = Nu.{(item.qty * item.price).toFixed(2)}
                                                            </Col>
                                                        </Row>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        )}
                                </ListGroup.Item>

                            </ListGroup>

                        </Col>

                        <Col md={4}>
                            <Card>
                                <ListGroup variant='flush'>
                                    <ListGroup.Item>
                                        <h2>Order Summary</h2>
                                    </ListGroup.Item>

                                    <ListGroup.Item>
                                        <Row>
                                            <Col>Items:</Col>
                                            <Col>Nu.{order.itemsPrice}</Col>
                                        </Row>
                                    </ListGroup.Item>

                                    <ListGroup.Item>
                                        <Row>
                                            <Col>Shipping:</Col>
                                            <Col>Nu.{order.shippingPrice}</Col>
                                        </Row>
                                    </ListGroup.Item>

                                    <ListGroup.Item>
                                        <Row>
                                            <Col>Tax:</Col>
                                            <Col>Nu.{order.taxPrice}</Col>
                                        </Row>
                                    </ListGroup.Item>

                                    <ListGroup.Item>
                                        <Row>
                                            <Col>Total:</Col>
                                            <Col>Nu.{order.totalPrice}</Col>
                                        </Row>
                                    </ListGroup.Item>


                                    {!order.isPaid && (

                                        <div>


                                        
                                        <ListGroup.Item className='my-3'>
                                            {/* {loadingPay && <Loader />}

                                            {!sdkReady ? (
                                                <Loader />
                                            ) : (
                                                    <PayPalButton
                                                        amount={order.totalPrice}
                                                        onSuccess={successPaymentHandler}
                                                    />
                                                )} */}

                                                <div className="payment-desc">

                                                    <p>*** Please use your mobile banking app to pay us, and include the transaction details below. Do not forget to take a screenshots of the transaction for further reference. Thank you! </p>


                                                    <Row>
                                                        <Col><h5>Acc No:</h5></Col>
                                                        <Col>xxxxxxxx</Col>
                                                    </Row>

                                                    <Row>
                                                        <Col><h5>Mobile No:</h5></Col>
                                                        <Col>77131316</Col>
                                                    </Row>
                                                    
                                                    <Row>
                                                        <Col><h5>BOB Acc Name:</h5></Col>
                                                        <Col>Farmacy</Col>
                                                    </Row>
                                                </div>    

                                        </ListGroup.Item>

                                        <ListGroup.Item>
                                            <h5>Submit transaction details</h5>

                                            {loadingPayMobile && <Loader />}
                                            {successPayMobile && <Message variant='success'>Transaction Details Submitted</Message>}
                                            {errorPayMobile && <Message variant='danger'>{errorPayMobile}</Message>}

                                            {userInfo ? (
                                                <Form onSubmit={submitHandler}>
                                                    <Form.Group controlId='bank'>
                                                        <Form.Label>Bank</Form.Label>
                                                        <Form.Control
                                                            as='select'
                                                            value={bank}
                                                            onChange={(e) => setBank(e.target.value)}
                                                        >
                                                            <option value=''>Select...</option>
                                                            <option value='BOB'>BOB</option>
                                                            <option value='BNB'>BNB</option>
                                                        </Form.Control>
                                                    </Form.Group>

                                                    <Form.Group controlId='transactionno'>
                                                        <Form.Label>Transaction No / Reference Code</Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            placeholder='Enter transaction number'
                                                            value={transactionno}
                                                            onChange={(e) => setTransactionNo(e.target.value)}
                                                        ></Form.Control>
                                                    </Form.Group>

                                                    {/* <Button
                                                        disabled={loadingPayMobile}
                                                        type='submit'
                                                        variant='primary'
                                                        onSuccess={successPaymentHandler}
                                                    >
                                                        Submit
                                                    </Button> */}
                        
                                                    <Button
                                                        disabled={loadingPayMobile}
                                                        type='submit'
                                                        className='btn btn-block my-3'   
                                                        onClick={successPaymentHandler}                                                     
                                                        >
                                                        Pay Now
                                                    </Button>

                                                </Form>
                                            ) : (
                                                    <Message variant='info'>Please <Link to='/login'>login</Link> to pay</Message>
                                                )}
                                        </ListGroup.Item>

                                        </div>
                
                                        
                                    )}
                                </ListGroup>
                                {loadingDeliver && <Loader />}
                                {userInfo && userInfo.isAdmin && order.isPaid && !order.isDelivered && (
                                    <ListGroup.Item>
                                        <Button
                                            type='button'
                                            className='btn btn-block'
                                            onClick={deliverHandler}
                                        >
                                            Mark As Delivered
                                        </Button>
                                    </ListGroup.Item>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </div>
            )
}

export default OrderScreen
