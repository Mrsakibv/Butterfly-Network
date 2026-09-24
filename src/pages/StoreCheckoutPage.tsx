import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Lock,
  Package,
  Percent,
  ShoppingCart,
  Tag,
  User,
  CreditCard,
  Copy,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';

interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  price: number;
  currency: string;
  features: string[] | null;
  is_active: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  product_id: string | null;
  discount_type: 'percentage' | 'fixed' | 'free';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  account_number: string;
  account_type: string;
  is_active: boolean;
  sort_order: number;
}

interface CreatedOrder {
  order_id: string;
  order_number: string;
  product_name: string;
  player_username: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_status: string;
  delivery_status: string;
}

const formatPrice = (
  amount: number,
  currency: string
) => {
  const symbol =
    currency === 'BDT' || currency === '৳'
      ? '৳'
      : currency;

  return `${symbol} ${Number(amount).toLocaleString()}`;
};

export const StoreCheckoutPage: React.FC = () => {
  const { navigate } = useRouter();

  const [product, setProduct] =
    useState<StoreProduct | null>(null);

  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>([]);

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] =
    useState('');

  const [transactionId, setTransactionId] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [promoInput, setPromoInput] =
    useState('');

  const [promo, setPromo] =
    useState<PromoCode | null>(null);

  const [promoLoading, setPromoLoading] =
    useState(false);

  const [promoMessage, setPromoMessage] =
    useState<string | null>(null);

  const [promoError, setPromoError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [createdOrder, setCreatedOrder] =
    useState<CreatedOrder | null>(null);

  useEffect(() => {
    document.title =
      'Checkout | Butterfly Minecraft Store';

    const loadCheckout = async () => {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const productId =
          params.get('product');

        if (!productId) {
          setError('No product selected.');
          setLoading(false);
          return;
        }

        const [
          productResult,
          paymentResult,
        ] = await Promise.all([
          supabase
            .from('store_products')
            .select(
              `
                id,
                name,
                slug,
                description,
                image_url,
                category,
                price,
                currency,
                features,
                is_active
              `
            )
            .eq('id', productId)
            .eq('is_active', true)
            .maybeSingle(),

          supabase
            .from('store_payment_methods')
            .select(
              `
                id,
                name,
                slug,
                description,
                account_number,
                account_type,
                is_active,
                sort_order
              `
            )
            .eq('is_active', true)
            .order('sort_order', {
              ascending: true,
            }),
        ]);

        if (productResult.error) {
          console.error(
            'Checkout product error:',
            productResult.error
          );

          setError(
            productResult.error.message
          );

          return;
        }

        if (!productResult.data) {
          setError(
            'This product is no longer available.'
          );

          return;
        }

        setProduct(
          productResult.data as StoreProduct
        );

        if (paymentResult.error) {
          console.error(
            'Payment methods error:',
            paymentResult.error
          );

          setError(
            'Unable to load payment methods. Please try again.'
          );

          return;
        }

        setPaymentMethods(
          (paymentResult.data || []) as PaymentMethod[]
        );

        if (
          paymentResult.data &&
          paymentResult.data.length > 0
        ) {
          setSelectedPaymentMethodId(
            paymentResult.data[0].id
          );
        }
      } catch (err) {
        console.error(
          'Checkout loading error:',
          err
        );

        setError(
          'Unable to load checkout.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, []);

  const originalPrice = product
    ? Number(product.price)
    : 0;

  const discountAmount = useMemo(() => {
    if (!product || !promo) {
      return 0;
    }

    let discount = 0;

    if (
      promo.discount_type ===
      'percentage'
    ) {
      discount =
        originalPrice *
        (Number(promo.discount_value) / 100);
    } else if (
      promo.discount_type === 'fixed'
    ) {
      discount =
        Number(promo.discount_value);
    } else if (
      promo.discount_type === 'free'
    ) {
      discount = originalPrice;
    }

    return Math.min(
      Math.max(discount, 0),
      originalPrice
    );
  }, [
    product,
    promo,
    originalPrice,
  ]);

  const finalPrice = Math.max(
    originalPrice - discountAmount,
    0
  );

  const isFreeOrder =
    finalPrice === 0;

  const selectedPaymentMethod =
    paymentMethods.find(
      (method) =>
        method.id ===
        selectedPaymentMethodId
    ) || null;

  const validateUsername = () => {
    const value =
      username.trim();

    if (!value) {
      return 'Minecraft username is required.';
    }

    if (
      value.length < 3 ||
      value.length > 16
    ) {
      return 'Minecraft username must be 3-16 characters.';
    }

    if (
      !/^[A-Za-z0-9_]+$/.test(value)
    ) {
      return 'Only letters, numbers and underscore are allowed.';
    }

    return null;
  };

  const validatePayment = () => {
    if (isFreeOrder) {
      return null;
    }

    if (!selectedPaymentMethod) {
      return 'Please select a payment method.';
    }

    if (!transactionId.trim()) {
      return 'Transaction ID is required.';
    }

    if (
      transactionId.trim().length < 3
    ) {
      return 'Please enter a valid transaction ID.';
    }

    return null;
  };

  const applyPromoCode = async () => {
    if (!product) {
      return;
    }

    const code =
      promoInput.trim().toUpperCase();

    setPromo(null);
    setPromoMessage(null);
    setPromoError(null);

    if (!code) {
      setPromoError(
        'Enter a promo code first.'
      );

      return;
    }

    setPromoLoading(true);

    try {
      const { data, error: queryError } =
        await supabase
          .from('store_promo_codes')
          .select(
            `
              id,
              code,
              product_id,
              discount_type,
              discount_value,
              max_uses,
              used_count,
              expires_at,
              is_active
            `
          )
          .eq('code', code)
          .eq('is_active', true)
          .maybeSingle();

      if (queryError) {
        console.error(
          'Promo lookup error:',
          queryError
        );

        setPromoError(
          'Unable to check promo code.'
        );

        return;
      }

      if (!data) {
        setPromoError(
          'Invalid or inactive promo code.'
        );

        return;
      }

      const promoData =
        data as PromoCode;

      if (
        promoData.product_id &&
        promoData.product_id !==
          product.id
      ) {
        setPromoError(
          'This promo code cannot be used for this product.'
        );

        return;
      }

      if (
        promoData.max_uses !== null &&
        promoData.used_count >=
          promoData.max_uses
      ) {
        setPromoError(
          'This promo code has reached its usage limit.'
        );

        return;
      }

      if (
        promoData.expires_at &&
        new Date(
          promoData.expires_at
        ) <= new Date()
      ) {
        setPromoError(
          'This promo code has expired.'
        );

        return;
      }

      setPromo(
        promoData
      );

      setPromoMessage(
        'Promo code applied successfully.'
      );

      setTransactionId('');
      setError(null);
    } catch (err) {
      console.error(
        'Promo error:',
        err
      );

      setPromoError(
        'Unable to apply promo code.'
      );
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromo(null);
    setPromoInput('');
    setPromoMessage(null);
    setPromoError(null);
    setError(null);
  };

  const copyPaymentNumber = async () => {
    if (
      !selectedPaymentMethod
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        selectedPaymentMethod.account_number
      );
    } catch (err) {
      console.error(
        'Copy payment number error:',
        err
      );
    }
  };

  const placeOrder = async () => {
    if (
      !product ||
      placingOrder
    ) {
      return;
    }

    setError(null);

    const usernameError =
      validateUsername();

    if (usernameError) {
      setError(
        usernameError
      );

      return;
    }

    const paymentError =
      validatePayment();

    if (paymentError) {
      setError(
        paymentError
      );

      return;
    }

    setPlacingOrder(true);

    try {
      const { data, error: orderError } =
        await supabase.rpc(
          'create_store_order',
          {
            p_player_username:
              username.trim(),

            p_product_id:
              product.id,

            p_promo_code:
              promo
                ? promo.code
                : null,

            p_payment_method:
              isFreeOrder
                ? null
                : selectedPaymentMethod
                    ?.name || null,

            p_transaction_id:
              isFreeOrder
                ? null
                : transactionId.trim(),
          }
        );

      if (orderError) {
        console.error(
          'Create order error:',
          orderError
        );

        setError(
          orderError.message ||
            'Unable to create order.'
        );

        return;
      }

      const order =
        Array.isArray(data)
          ? data[0]
          : data;

      if (!order) {
        setError(
          'Order was not created.'
        );

        return;
      }

      setCreatedOrder(
        order as CreatedOrder
      );
    } catch (err) {
      console.error(
        'Order creation error:',
        err
      );

      setError(
        'Something went wrong while creating the order.'
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
            Loading checkout...
          </div>
        </div>
      </div>
    );
  }

  if (createdOrder) {
    return (
      <div className="min-h-screen pt-28 pb-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            className="overflow-hidden rounded-3xl border border-green-500/20 bg-white/[0.03]"
          >
            <div className="border-b border-white/10 bg-green-500/5 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-400/20 bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>

              <h1 className="mt-5 text-3xl font-black text-white">
                Order Created
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Your order has been submitted successfully.
              </p>
            </div>

            <div className="space-y-4 p-6 sm:p-8">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Order Number
                </div>

                <div className="mt-2 font-mono text-xl font-black text-purple-300">
                  {createdOrder.order_number}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="text-xs text-slate-500">
                    Minecraft Username
                  </div>

                  <div className="mt-1 font-semibold text-white">
                    {createdOrder.player_username}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="text-xs text-slate-500">
                    Product
                  </div>

                  <div className="mt-1 font-semibold text-white">
                    {createdOrder.product_name}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    Original amount
                  </span>

                  <span className="text-white">
                    {formatPrice(
                      Number(
                        createdOrder.original_amount
                      ),
                      product?.currency ||
                        'BDT'
                    )}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    Discount
                  </span>

                  <span className="text-green-400">
                    -
                    {formatPrice(
                      Number(
                        createdOrder.discount_amount
                      ),
                      product?.currency ||
                        'BDT'
                    )}
                  </span>
                </div>

                <div className="my-4 h-px bg-white/10" />

                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    Final Amount
                  </span>

                  <span className="text-xl font-black text-purple-300">
                    {formatPrice(
                      Number(
                        createdOrder.final_amount
                      ),
                      product?.currency ||
                        'BDT'
                    )}
                  </span>
                </div>
              </div>

              {Number(
                createdOrder.final_amount
              ) > 0 ? (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />

                    <div>
                      <div className="font-bold text-white">
                        Payment Verification Pending
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Your payment information has been submitted.
                        The order will be delivered after payment
                        verification.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                  <div className="flex items-start gap-3">
                    <Package className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />

                    <div>
                      <div className="font-bold text-white">
                        Free Order
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Your 100% discount order has been created
                        successfully.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() =>
                  navigate('/pricing')
                }
                className="w-full rounded-xl bg-white px-5 py-3.5 text-sm font-black text-black transition-transform hover:scale-[1.01]"
              >
                Back to Minecraft Store
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-28 pb-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
            <CircleAlert className="mx-auto h-8 w-8 text-red-400" />

            <h1 className="mt-4 text-xl font-bold text-white">
              Checkout unavailable
            </h1>

            <p className="mt-2 text-sm text-red-300/80">
              {error ||
                'Product not found.'}
            </p>

            <button
              onClick={() =>
                navigate('/pricing')
              }
              className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="pointer-events-none fixed left-1/2 top-20 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[160px]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() =>
            navigate(
              `/store/product/${encodeURIComponent(
                product.slug
              )}`
            )
          }
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product
        </button>

        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
            Secure Checkout
          </div>

          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            Complete your order
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Enter your Minecraft username, apply a promo code,
            and complete payment.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          {/* LEFT */}
          <div className="space-y-5">

            {/* Player */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
                  <User className="h-5 w-5 text-purple-300" />
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    Minecraft Account
                  </h2>

                  <p className="text-xs text-slate-500">
                    The reward will be delivered to this username.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Minecraft Username
                </label>

                <input
                  value={username}
                  onChange={(event) => {
                    setUsername(
                      event.target.value
                    );

                    setError(null);
                  }}
                  placeholder="Enter your Minecraft username"
                  maxLength={16}
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/10"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Example: ButterflyPlayer
                </p>
              </div>
            </div>

            {/* Promo */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10">
                  <Tag className="h-5 w-5 text-green-300" />
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    Promo Code
                  </h2>

                  <p className="text-xs text-slate-500">
                    Have a discount code? Apply it here.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <input
                  value={promoInput}
                  onChange={(event) => {
                    setPromoInput(
                      event.target.value.toUpperCase()
                    );

                    setPromo(null);
                    setPromoMessage(null);
                    setPromoError(null);
                    setError(null);
                  }}
                  disabled={!!promo}
                  placeholder="BUTTERFLYVIP"
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-white outline-none transition focus:border-purple-400/50"
                />

                {promo ? (
                  <button
                    onClick={removePromo}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-bold text-red-300 hover:bg-red-500/15"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={applyPromoCode}
                    disabled={
                      promoLoading ||
                      !promoInput.trim()
                    }
                    className="rounded-xl bg-white px-5 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {promoLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </button>
                )}
              </div>

              {promoMessage && (
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {promoMessage}
                </div>
              )}

              {promoError && (
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-400">
                  <CircleAlert className="h-4 w-4" />
                  {promoError}
                </div>
              )}
            </div>

            {/* PAYMENT */}
            {!isFreeOrder && (
              <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
                    <CreditCard className="h-5 w-5 text-purple-300" />
                  </div>

                  <div>
                    <h2 className="font-bold text-white">
                      Payment
                    </h2>

                    <p className="text-xs text-slate-500">
                      Send the exact amount and enter your transaction ID.
                    </p>
                  </div>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                      <div>
                        <div className="font-bold text-red-300">
                          No payment method available
                        </div>

                        <p className="mt-1 text-xs leading-5 text-red-300/70">
                          Payment methods have not been configured yet.
                          Please contact the store administrator.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Payment Method
                      </label>

                      <select
                        value={
                          selectedPaymentMethodId
                        }
                        onChange={(event) => {
                          setSelectedPaymentMethodId(
                            event.target.value
                          );

                          setError(null);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm font-semibold text-white outline-none transition focus:border-purple-400/50"
                      >
                        <option
                          value=""
                          className="bg-slate-900"
                        >
                          Select payment method
                        </option>

                        {paymentMethods.map(
                          (method) => (
                            <option
                              key={method.id}
                              value={method.id}
                              className="bg-slate-900"
                            >
                              {method.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {selectedPaymentMethod && (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Send Money
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <div className="font-mono text-2xl font-black text-white">
                              {
                                selectedPaymentMethod.account_number
                              }
                            </div>

                            <button
                              type="button"
                              onClick={
                                copyPaymentNumber
                              }
                              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </button>
                          </div>

                          <div className="mt-2 text-xs text-slate-500">
                            {
                              selectedPaymentMethod.account_type
                            }
                          </div>

                          {selectedPaymentMethod.description && (
                            <p className="mt-3 text-xs leading-5 text-slate-500">
                              {
                                selectedPaymentMethod.description
                              }
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                          <div className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                            Amount to Pay
                          </div>

                          <div className="mt-1 text-3xl font-black text-white">
                            {formatPrice(
                              finalPrice,
                              product.currency
                            )}
                          </div>

                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            Please send exactly this amount to
                            the selected payment number.
                          </p>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-300">
                            Transaction ID
                          </label>

                          <input
                            value={
                              transactionId
                            }
                            onChange={(event) => {
                              setTransactionId(
                                event.target.value
                              );

                              setError(null);
                            }}
                            placeholder="Enter your transaction ID"
                            maxLength={100}
                            autoComplete="off"
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm font-semibold text-white outline-none transition focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/10"
                          />

                          <p className="mt-2 text-xs text-slate-500">
                            Enter the transaction ID you received
                            after sending the payment.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Free order notice */}
            {isFreeOrder && (
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />

                  <div>
                    <h2 className="font-bold text-white">
                      100% Discount Applied
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      This order is completely free. No payment
                      method or transaction ID is required.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-slate-500" />

                <p className="text-xs leading-5 text-slate-500">
                  Your order is validated by the Store order system
                  before it is created.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div className="sticky top-28 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
              {/* Product */}
              <div className="border-b border-white/10 p-6">
                <div className="flex items-start gap-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-20 w-20 rounded-2xl border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                      <Package className="h-8 w-8 text-purple-300" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      {product.category ||
                        'Store'}
                    </div>

                    <h2 className="mt-1 text-lg font-bold text-white">
                      {product.name}
                    </h2>

                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {product.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-6">
                <div className="mb-5 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-purple-400" />

                  <h2 className="text-sm font-bold text-white">
                    Order Summary
                  </h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">
                      Product
                    </span>

                    <span className="max-w-[180px] text-right font-semibold text-white">
                      {product.name}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      Original price
                    </span>

                    <span className="text-white">
                      {formatPrice(
                        originalPrice,
                        product.currency
                      )}
                    </span>
                  </div>

                  {promo && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-green-400">
                        <Percent className="h-3.5 w-3.5" />
                        Discount
                      </span>

                      <span className="font-semibold text-green-400">
                        -
                        {formatPrice(
                          discountAmount,
                          product.currency
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="my-5 h-px bg-white/10" />

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-slate-500">
                      Total
                    </div>

                    <div className="mt-1 text-2xl font-black text-white">
                      {formatPrice(
                        finalPrice,
                        product.currency
                      )}
                    </div>
                  </div>

                  {isFreeOrder && (
                    <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-green-400">
                      Free
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold leading-5 text-red-300">
                    {error}
                  </div>
                )}

                <button
                  onClick={placeOrder}
                  disabled={
                    placingOrder ||
                    !username.trim() ||
                    (
                      !isFreeOrder &&
                      (
                        !selectedPaymentMethod ||
                        !transactionId.trim()
                      )
                    )
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 px-5 py-4 text-sm font-black text-white shadow-[0_15px_40px_rgba(124,58,237,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(124,58,237,0.35)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Order...
                    </>
                  ) : isFreeOrder ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Place Free Order
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Confirm Order
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[11px] leading-5 text-slate-600">
                  By placing this order, you confirm that the
                  Minecraft username and payment information are
                  correct.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};