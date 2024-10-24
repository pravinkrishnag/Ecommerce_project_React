import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { Box, Button, Checkbox, FormControlLabel } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { addStuff } from '../../../redux/userHandle';
import { useNavigate, useParams } from 'react-router-dom';
import Popup from '../../../components/Popup';
import { fetchProductDetailsFromCart, removeAllFromCart, removeSpecificProduct } from '../../../redux/userSlice';

const PaymentForm = ({ handleBack }) => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { status, currentUser, productDetailsCart } = useSelector(state => state.user);

    const params = useParams();
    const productID = params.id;

    const [paymentData, setPaymentData] = useState({
        cardName: '',
        cardNumber: '',
        expDate: '',
        cvv: '',
    });

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [cashOnDelivery, setCashOnDelivery] = useState(false); // COD option
    const [isCardDisabled, setIsCardDisabled] = useState(false); // Disable card fields if expired or COD is selected

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setPaymentData((prevData) => ({
            ...prevData,
            [id]: value,
        }));
    };

    const handleCODChange = (e) => {
        setCashOnDelivery(e.target.checked);
        setIsCardDisabled(e.target.checked); // Disable card fields if COD is selected
    };

    const [isExpired, setIsExpired] = useState(false); // Check if the card is expired

    useEffect(() => {
        if (productID) {
            dispatch(fetchProductDetailsFromCart(productID));
        }
    }, [productID, dispatch]);

    const productsQuantity = currentUser.cartDetails.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = currentUser.cartDetails.reduce((total, item) => total + (item.quantity * item.price.cost), 0);

    const singleProductQuantity = productDetailsCart && productDetailsCart.quantity;
    const totalsingleProductPrice = productDetailsCart && productDetailsCart.price && productDetailsCart.price.cost * productDetailsCart.quantity;

    const paymentID = `${paymentData.cardNumber.slice(-4)}-${paymentData.expDate.slice(0, 2)}${paymentData.expDate.slice(-2)}-${Date.now()}`;
    const paymentInfo = cashOnDelivery 
        ? { id: `COD-${Date.now()}`, status: "Cash on Delivery" } 
        : { id: paymentID, status: "Successful" };

    const multiOrderData = {
        buyer: currentUser._id,
        shippingData: currentUser.shippingData,
        orderedProducts: currentUser.cartDetails,
        paymentInfo,
        productsQuantity,
        totalPrice,
    };

    const singleOrderData = {
        buyer: currentUser._id,
        shippingData: currentUser.shippingData,
        orderedProducts: productDetailsCart,
        paymentInfo,
        productsQuantity: singleProductQuantity,
        totalPrice: totalsingleProductPrice,
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!cashOnDelivery && isExpired) {
            setMessage("Your card is expired. Please choose a valid payment method or use Cash on Delivery.");
            setShowPopup(true);
            return;
        }

        if (productID) {
            dispatch(addStuff("newOrder", singleOrderData));
            dispatch(removeSpecificProduct(productID));
        } else {
            dispatch(addStuff("newOrder", multiOrderData));
            dispatch(removeAllFromCart());
        }
    };

    useEffect(() => {
        if (paymentData.expDate) {
            const today = new Date();
            const expDate = new Date(paymentData.expDate);
            setIsExpired(expDate < today); // Check if the expiration date is in the past
        }
    }, [paymentData.expDate]);

    useEffect(() => {
        if (status === 'added') {
            navigate('/Aftermath');
        } else if (status === 'failed') {
            setMessage("Order Failed");
            setShowPopup(true);
        } else if (status === 'error') {
            setMessage("Network Error");
            setShowPopup(true);
        }
    }, [status, navigate]);

    return (
        <React.Fragment>
            <Typography variant="h6" gutterBottom>
                Payment method: {cashOnDelivery ? "Cash on Delivery" : "RazerPay"}
            </Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            required={!cashOnDelivery}
                            disabled={isCardDisabled}
                            id="cardName"
                            label="Name on card"
                            fullWidth
                            autoComplete="cc-name"
                            variant="standard"
                            value={paymentData.cardName}
                            onChange={handleInputChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            required={!cashOnDelivery}
                            disabled={isCardDisabled}
                            id="cardNumber"
                            label="Card number"
                            type="number"
                            fullWidth
                            autoComplete="cc-number"
                            variant="standard"
                            value={paymentData.cardNumber}
                            onChange={handleInputChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            required={!cashOnDelivery}
                            disabled={isCardDisabled}
                            id="expDate"
                            type="date"
                            fullWidth
                            autoComplete="cc-exp"
                            variant="standard"
                            value={paymentData.expDate}
                            onChange={handleInputChange}
                            error={isExpired}
                            helperText={isExpired ? "Expired" : "Expiry date"} 
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            required={!cashOnDelivery}
                            disabled={isCardDisabled}
                            id="cvv"
                            label="CVV"
                            type="password"
                            helperText="Last three digits on signature strip"
                            fullWidth
                            autoComplete="cc-csc"
                            variant="standard"
                            value={paymentData.cvv}
                            onChange={handleInputChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={<Checkbox checked={cashOnDelivery} onChange={handleCODChange} />}
                            label="Cash on Delivery"
                        />
                    </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={handleBack} sx={{ mt: 3, ml: 1 }}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        sx={{ mt: 3, ml: 1 }}
                    >
                        Place order
                    </Button>
                </Box>
            </form>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </React.Fragment>
    );
}

export default PaymentForm;
