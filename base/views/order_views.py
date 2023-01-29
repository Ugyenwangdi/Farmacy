from django.shortcuts import render

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser 
from rest_framework.response import Response

from base.models import Product, Order, OrderItem, ShippingAddress, Transaction 
from base.serializers import ProductSerializer, OrderSerializer

from rest_framework import status 
from datetime import datetime


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def addOrderItems(request):

    user = request.user 
    data = request.data

    orderItems = data['orderItems']

    if orderItems and len(orderItems) == 0:
        return Response({'detail': 'No Order Items'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        # (1) Create order 
        order = Order.objects.create(
            user=user,
            paymentMethod=data['paymentMethod'],
            taxPrice=data['taxPrice'],
            shippingPrice=data['shippingPrice'],
            totalPrice=data['totalPrice']
        )

        # (2) Create shipping address 
        shipping = ShippingAddress.objects.create(
            order = order,
            address = data['shippingAddress']['address'],
            city = data['shippingAddress']['city'],
            postalCode = data['shippingAddress']['postalCode'],
            country = data['shippingAddress']['country'],
        )

        # (3) Create order items and set order to orderItem relationship
        for i in orderItems:
            product = Product.objects.get(_id=i['product'])

            item = OrderItem.objects.create(
                product=product,
                order = order,
                name = product.name,
                qty = i['qty'],
                price = i['price'],
                image = product.image.url,
            )

            # (4) Update stock
            product.countInStock -= item.qty 
            product.save()


        serializer = OrderSerializer(order, many=False)

        return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getMyOrders(request):
    user = request.user 
    orders = user.order_set.all().order_by('-createdAt')
    serializer = OrderSerializer(orders, many=True) 
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def getOrders(request):
    orders = Order.objects.all().order_by('-createdAt')
    serializer = OrderSerializer(orders, many=True) 
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getOrderById(request, pk):

    user = request.user 

    try:
        order = Order.objects.get(_id=pk) 
        if user.is_staff or order.user == user:
            serializer = OrderSerializer(order, many=False)
            return Response(serializer.data) 

        else:
            Response({'detail': 'Not authorized to view this order'}, status=status.HTTP_400_BAD_REQUEST)
    except:
        return Response({'detail': 'Order does not exist'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateOrderToPaid(request, pk):
    order = Order.objects.get(_id=pk)
    
    # order.isPaid = True 
    # order.paidAt = datetime.now()
    # order.save()
   

    return Response('Order was paid')


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateOrderToDelivered(request, pk):
    order = Order.objects.get(_id=pk)

    order.isDelivered = True 
    order.deliveredAt = datetime.now()
    order.save()

    return Response('Order was delivered!')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createOrderTransaction(request, pk):
    user = request.user 
    order = Order.objects.get(_id=pk)
    data = request.data 

    # 1. Review already exists 
    alreadyExists = order.transaction_set.filter(user=user).exists()

    if alreadyExists:
        content = {'detail': 'Already submitted!, your payment status is pending.'}
        return Response(content, status=status.HTTP_400_BAD_REQUEST) 

    # 2. Review with no rating or 0 
    elif data['bank'] == '':
        content = {'detail': 'Please select a bank.'}
        return Response(content, status=status.HTTP_400_BAD_REQUEST) 

    elif data['transactionno'] == '':
        content = {'detail': 'Please enter the transaction no.'}
        return Response(content, status=status.HTTP_400_BAD_REQUEST) 

    # 3. Create review 
    else:
        transaction = Transaction.objects.create(
            user = user,
            order = order,
            name = user.first_name,
            bank = data['bank'],
            transactionNo = data['transactionno']
        )

        order.isPaid = True 
        order.paidAt = datetime.now()
        order.save()


        return Response('Transaction detail added!')