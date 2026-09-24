import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Coins,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Package,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react';

import { AdminStorePaymentMethods } from './AdminStorePaymentMethods';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

type StoreTab =
  | 'overview'
  | 'products'
  | 'promos'
  | 'orders'
  | 'deliveries'
  | 'payment_methods';

interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  category: string;
  price: number;
  currency: string;
  features: string[];
  minecraft_commands: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

interface StoreOrder {
  id: string;
  order_number: string;
  player_username: string;
  product_id: string | null;
  promo_code_id: string | null;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string | null;
  transaction_id: string | null;
  payment_status:
    | 'pending'
    | 'paid'
    | 'failed'
    | 'refunded';
  delivery_status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed';
  created_at: string;
  completed_at: string | null;
  product?: {
    name: string;
  } | null;
}

interface StoreDelivery {
  id: string;
  order_id: string;
  player_username: string;
  commands: string[];
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed';
  attempts: number;
  error_message: string | null;
  delivered_at: string | null;
  created_at: string;
  order?: {
    order_number: string;
  } | null;
}

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  category: string;
  price: string;
  features: string;
  minecraft_commands: string;
  is_active: boolean;
  sort_order: string;
}

interface PromoForm {
  code: string;
  product_id: string;
  discount_type: 'percentage' | 'fixed' | 'free';
  discount_value: string;
  max_uses: string;
  expires_at: string;
  is_active: boolean;
}

const EMPTY_PRODUCT: ProductForm = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  category: 'ranks',
  price: '0',
  features: '',
  minecraft_commands: '',
  is_active: true,
  sort_order: '0',
};

const EMPTY_PROMO: PromoForm = {
  code: '',
  product_id: '',
  discount_type: 'percentage',
  discount_value: '10',
  max_uses: '',
  expires_at: '',
  is_active: true,
};

const categories = [
  {
    value: 'ranks',
    label: 'Ranks',
    icon: Crown,
  },
  {
    value: 'keys',
    label: 'Keys',
    icon: KeyRound,
  },
  {
    value: 'coins',
    label: 'Coins',
    icon: Coins,
  },
  {
    value: 'wings',
    label: 'Wings',
    icon: Sparkles,
  },
  {
    value: 'other',
    label: 'Other',
    icon: Package,
  },
];

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(value: string | null) {
  if (!value) return '—';

  return new Date(value).toLocaleString();
}

function formatMoney(
  amount: number,
  currency = 'BDT'
) {
  const symbol =
    currency === 'BDT' || currency === '৳'
      ? '৳'
      : currency;

  return `${symbol}${Number(amount).toLocaleString()}`;
}

function getCategoryIcon(category: string) {
  return (
    categories.find(
      (item) => item.value === category
    )?.icon || Package
  );
}

function statusClass(status: string) {
  switch (status) {
    case 'completed':
    case 'paid':
    case 'active':
      return 'bg-green-500/10 text-green-400 border-green-500/20';

    case 'processing':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';

    case 'failed':
    case 'refunded':
      return 'bg-red-500/10 text-red-400 border-red-500/20';

    default:
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  }
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10';

const textareaClass =
  'w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10';

export const AdminStore: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] =
    useState<StoreTab>('overview');

  const [products, setProducts] = useState<
    StoreProduct[]
  >([]);

  const [promos, setPromos] = useState<
    PromoCode[]
  >([]);

  const [orders, setOrders] = useState<
    StoreOrder[]
  >([]);

  const [deliveries, setDeliveries] = useState<
    StoreDelivery[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] = useState('');

  const [productEditor, setProductEditor] =
    useState(false);

  const [promoEditor, setPromoEditor] =
    useState(false);

  const [editingProductId, setEditingProductId] =
    useState<string | null>(null);

  const [editingPromoId, setEditingPromoId] =
    useState<string | null>(null);

  const [productForm, setProductForm] =
    useState<ProductForm>(EMPTY_PRODUCT);

  const [promoForm, setPromoForm] =
    useState<PromoForm>(EMPTY_PROMO);

  const [savingProduct, setSavingProduct] =
    useState(false);

  const [savingPromo, setSavingPromo] =
    useState(false);

  const [orderStatusFilter, setOrderStatusFilter] =
    useState('all');

  const [deliveryStatusFilter, setDeliveryStatusFilter] =
    useState('all');

  const [selectedOrder, setSelectedOrder] =
    useState<StoreOrder | null>(null);

  const [selectedDelivery, setSelectedDelivery] =
    useState<StoreDelivery | null>(null);

  const loadAll = async () => {
    setLoading(true);

    const [
      productsResult,
      promosResult,
      ordersResult,
      deliveriesResult,
    ] = await Promise.all([
      supabase
        .from('store_products')
        .select('*')
        .order('sort_order', {
          ascending: true,
        })
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('store_promo_codes')
        .select('*')
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('store_orders')
        .select(
          `
            *,
            product:store_products(name)
          `
        )
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('store_deliveries')
        .select(
          `
            *,
            order:store_orders(order_number)
          `
        )
        .order('created_at', {
          ascending: false,
        }),
    ]);

    if (productsResult.error) {
      showToast(
        'Products Error',
        productsResult.error.message,
        'error'
      );
    }

    if (promosResult.error) {
      showToast(
        'Promo Codes Error',
        promosResult.error.message,
        'error'
      );
    }

    if (ordersResult.error) {
      showToast(
        'Orders Error',
        ordersResult.error.message,
        'error'
      );
    }

    if (deliveriesResult.error) {
      showToast(
        'Deliveries Error',
        deliveriesResult.error.message,
        'error'
      );
    }

    setProducts(
      (productsResult.data || []) as StoreProduct[]
    );

    setPromos(
      (promosResult.data || []) as PromoCode[]
    );

    setOrders(
      (ordersResult.data || []) as StoreOrder[]
    );

    setDeliveries(
      (deliveriesResult.data || []) as StoreDelivery[]
    );

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const refresh = async () => {
    setRefreshing(true);

    await loadAll();

    setRefreshing(false);
  };

  /* ==========================================
     PRODUCT
  ========================================== */

  const openCreateProduct = () => {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT);
    setProductEditor(true);
  };

  const openEditProduct = (
    product: StoreProduct
  ) => {
    setEditingProductId(product.id);

    setProductForm({
      name: product.name,
      slug: product.slug,
      description:
        product.description || '',
      image_url:
        product.image_url || '',
      category:
        product.category || 'other',
      price: String(product.price),
      features: Array.isArray(
        product.features
      )
        ? product.features.join('\n')
        : '',
      minecraft_commands:
        Array.isArray(
          product.minecraft_commands
        )
          ? product.minecraft_commands.join('\n')
          : '',
      is_active: product.is_active,
      sort_order: String(
        product.sort_order
      ),
    });

    setProductEditor(true);
  };

  const saveProduct = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!productForm.name.trim()) {
      showToast(
        'Product Error',
        'Product name is required.',
        'error'
      );
      return;
    }

    if (!productForm.slug.trim()) {
      showToast(
        'Product Error',
        'Product slug is required.',
        'error'
      );
      return;
    }

    const price = Number(
      productForm.price
    );

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      showToast(
        'Product Error',
        'Enter a valid price.',
        'error'
      );
      return;
    }

    setSavingProduct(true);

    const payload = {
      name: productForm.name.trim(),
      slug: productForm.slug.trim(),
      description:
        productForm.description.trim() ||
        null,
      image_url:
        productForm.image_url.trim() ||
        null,
      category:
        productForm.category,
      price,
      currency: 'BDT',
      features:
        productForm.features
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      minecraft_commands:
        productForm.minecraft_commands
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      is_active:
        productForm.is_active,
      sort_order:
        Number(productForm.sort_order) || 0,
    };

    const result = editingProductId
      ? await supabase
          .from('store_products')
          .update(payload)
          .eq(
            'id',
            editingProductId
          )
      : await supabase
          .from('store_products')
          .insert(payload);

    if (result.error) {
      showToast(
        'Product Error',
        result.error.message,
        'error'
      );

      setSavingProduct(false);
      return;
    }

    showToast(
      'Success',
      editingProductId
        ? 'Product updated.'
        : 'Product created.',
      'success'
    );

    setSavingProduct(false);
    setProductEditor(false);
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT);

    await loadAll();
  };

  const deleteProduct = async (
    product: StoreProduct
  ) => {
    if (
      !window.confirm(
        `Delete "${product.name}"?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from('store_products')
      .delete()
      .eq('id', product.id);

    if (error) {
      showToast(
        'Delete Failed',
        error.message,
        'error'
      );
      return;
    }

    showToast(
      'Product Deleted',
      `${product.name} was deleted.`,
      'success'
    );

    await loadAll();
  };

  const toggleProduct = async (
    product: StoreProduct
  ) => {
    const { error } = await supabase
      .from('store_products')
      .update({
        is_active: !product.is_active,
      })
      .eq('id', product.id);

    if (error) {
      showToast(
        'Update Failed',
        error.message,
        'error'
      );
      return;
    }

    await loadAll();
  };

  /* ==========================================
     PROMO
  ========================================== */

  const openCreatePromo = () => {
    setEditingPromoId(null);
    setPromoForm(EMPTY_PROMO);
    setPromoEditor(true);
  };

  const openEditPromo = (
    promo: PromoCode
  ) => {
    setEditingPromoId(promo.id);

    setPromoForm({
      code: promo.code,
      product_id:
        promo.product_id || '',
      discount_type:
        promo.discount_type,
      discount_value:
        String(promo.discount_value),
      max_uses:
        promo.max_uses === null
          ? ''
          : String(promo.max_uses),
      expires_at:
        promo.expires_at
          ? new Date(
              promo.expires_at
            )
              .toISOString()
              .slice(0, 16)
          : '',
      is_active:
        promo.is_active,
    });

    setPromoEditor(true);
  };

  const savePromo = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const code =
      promoForm.code
        .trim()
        .toUpperCase();

    if (!code) {
      showToast(
        'Promo Error',
        'Promo code is required.',
        'error'
      );
      return;
    }

    const discountValue =
      promoForm.discount_type === 'free'
        ? 0
        : Number(
            promoForm.discount_value
          );

    if (
      Number.isNaN(
        discountValue
      ) ||
      discountValue < 0
    ) {
      showToast(
        'Promo Error',
        'Enter a valid discount value.',
        'error'
      );
      return;
    }

    if (
      promoForm.discount_type ===
        'percentage' &&
      discountValue > 100
    ) {
      showToast(
        'Promo Error',
        'Percentage discount cannot exceed 100%.',
        'error'
      );
      return;
    }

    const maxUses =
      promoForm.max_uses.trim()
        ? Number(
            promoForm.max_uses
          )
        : null;

    if (
      maxUses !== null &&
      (!Number.isInteger(maxUses) ||
        maxUses < 1)
    ) {
      showToast(
        'Promo Error',
        'Max uses must be a positive whole number.',
        'error'
      );
      return;
    }

    setSavingPromo(true);

    const payload = {
      code,
      product_id:
        promoForm.product_id ||
        null,
      discount_type:
        promoForm.discount_type,
      discount_value:
        discountValue,
      max_uses: maxUses,
      expires_at:
        promoForm.expires_at
          ? new Date(
              promoForm.expires_at
            ).toISOString()
          : null,
      is_active:
        promoForm.is_active,
    };

    const result = editingPromoId
      ? await supabase
          .from(
            'store_promo_codes'
          )
          .update(payload)
          .eq(
            'id',
            editingPromoId
          )
      : await supabase
          .from(
            'store_promo_codes'
          )
          .insert(payload);

    if (result.error) {
      showToast(
        'Promo Error',
        result.error.message,
        'error'
      );

      setSavingPromo(false);
      return;
    }

    showToast(
      'Success',
      editingPromoId
        ? 'Promo code updated.'
        : 'Promo code created.',
      'success'
    );

    setSavingPromo(false);
    setPromoEditor(false);
    setEditingPromoId(null);
    setPromoForm(EMPTY_PROMO);

    await loadAll();
  };

  const deletePromo = async (
    promo: PromoCode
  ) => {
    if (
      !window.confirm(
        `Delete promo code "${promo.code}"?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from('store_promo_codes')
      .delete()
      .eq('id', promo.id);

    if (error) {
      showToast(
        'Delete Failed',
        error.message,
        'error'
      );
      return;
    }

    showToast(
      'Promo Deleted',
      `${promo.code} was deleted.`,
      'success'
    );

    await loadAll();
  };

  const togglePromo = async (
    promo: PromoCode
  ) => {
    const { error } = await supabase
      .from('store_promo_codes')
      .update({
        is_active:
          !promo.is_active,
      })
      .eq('id', promo.id);

    if (error) {
      showToast(
        'Update Failed',
        error.message,
        'error'
      );
      return;
    }

    await loadAll();
  };

  /* ==========================================
     ORDERS
  ========================================== */

  const updateOrderStatus = async (
    order: StoreOrder,
    status:
      | 'pending'
      | 'paid'
      | 'failed'
      | 'refunded'
  ) => {
    const { error } = await supabase
      .from('store_orders')
      .update({
        payment_status: status,
        ...(status === 'paid'
          ? {
              delivery_status:
                order.delivery_status ===
                'completed'
                  ? 'completed'
                  : 'pending',
            }
          : {}),
      })
      .eq(
        'id',
        order.id
      );

    if (error) {
      showToast(
        'Order Update Failed',
        error.message,
        'error'
      );

      return false;
    }

    showToast(
      'Order Updated',
      `Payment status changed to ${status}.`,
      'success'
    );

    await loadAll();

    return true;
  };

  const verifyAndPayOrder = async (
    order: StoreOrder
  ) => {
    if (
      Number(order.final_amount) > 0 &&
      !order.transaction_id
    ) {
      showToast(
        'Payment Verification',
        'This paid order has no transaction ID.',
        'error'
      );

      return;
    }

    const success =
      await updateOrderStatus(
        order,
        'paid'
      );

    if (success) {
      setSelectedOrder(null);
    }
  };

  const failOrderPayment = async (
    order: StoreOrder
  ) => {
    const success =
      await updateOrderStatus(
        order,
        'failed'
      );

    if (success) {
      setSelectedOrder(null);
    }
  };

  const refundOrder = async (
    order: StoreOrder
  ) => {
    if (
      !window.confirm(
        `Mark order ${order.order_number} as refunded?`
      )
    ) {
      return;
    }

    const success =
      await updateOrderStatus(
        order,
        'refunded'
      );

    if (success) {
      setSelectedOrder(null);
    }
  };

  const updateDeliveryStatus = async (
    delivery: StoreDelivery,
    status:
      | 'pending'
      | 'processing'
      | 'completed'
      | 'failed'
  ) => {
    const { error } = await supabase
      .from('store_deliveries')
      .update({
        status,
        ...(status ===
        'completed'
          ? {
              delivered_at:
                new Date().toISOString(),
              error_message: null,
            }
          : {}),
      })
      .eq(
        'id',
        delivery.id
      );

    if (error) {
      showToast(
        'Delivery Update Failed',
        error.message,
        'error'
      );

      return;
    }

    if (status === 'completed') {
      const { error: orderError } =
        await supabase
          .from('store_orders')
          .update({
            delivery_status:
              'completed',
            completed_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            delivery.order_id
          );

      if (orderError) {
        showToast(
          'Order Sync Warning',
          orderError.message,
          'error'
        );
      }
    } else {
      const { error: orderError } =
        await supabase
          .from('store_orders')
          .update({
            delivery_status:
              status,
          })
          .eq(
            'id',
            delivery.order_id
          );

      if (orderError) {
        showToast(
          'Order Sync Warning',
          orderError.message,
          'error'
        );
      }
    }

    showToast(
      'Delivery Updated',
      `Delivery status changed to ${status}.`,
      'success'
    );

    await loadAll();
  };

  /* ==========================================
     FILTERS
  ========================================== */

  const filteredProducts =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(value) ||
          product.slug
            .toLowerCase()
            .includes(value) ||
          product.category
            .toLowerCase()
            .includes(value)
      );
    }, [products, search]);

  const filteredPromos =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return promos;
      }

      return promos.filter(
        (promo) =>
          promo.code
            .toLowerCase()
            .includes(value)
      );
    }, [promos, search]);

  const filteredOrders =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          const matchesStatus =
            orderStatusFilter ===
              'all' ||
            order.payment_status ===
              orderStatusFilter ||
            order.delivery_status ===
              orderStatusFilter;

          const matchesSearch =
            !value ||
            order.order_number
              .toLowerCase()
              .includes(value) ||
            order.player_username
              .toLowerCase()
              .includes(value) ||
            (order.product?.name ||
              '')
              .toLowerCase()
              .includes(value) ||
            (order.transaction_id ||
              '')
              .toLowerCase()
              .includes(value);

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      orders,
      search,
      orderStatusFilter,
    ]);

  const filteredDeliveries =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return deliveries.filter(
        (delivery) => {
          const matchesStatus =
            deliveryStatusFilter ===
              'all' ||
            delivery.status ===
              deliveryStatusFilter;

          const matchesSearch =
            !value ||
            delivery.player_username
              .toLowerCase()
              .includes(value) ||
            (
              delivery.order
                ?.order_number || ''
            )
              .toLowerCase()
              .includes(value);

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      deliveries,
      search,
      deliveryStatusFilter,
    ]);

  /* ==========================================
     STATS
  ========================================== */

  const totalRevenue =
    orders
      .filter(
        (order) =>
          order.payment_status ===
          'paid'
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(
            order.final_amount
          ),
        0
      );

  const pendingOrders =
    orders.filter(
      (order) =>
        order.delivery_status ===
        'pending'
    ).length;

  const completedOrders =
    orders.filter(
      (order) =>
        order.delivery_status ===
        'completed'
    ).length;

  const activePromos =
    promos.filter(
      (promo) =>
        promo.is_active
    ).length;

  /* ==========================================
     TABS
  ========================================== */

  const tabs: {
    id: StoreTab;
    label: string;
    icon: React.ElementType;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: ShoppingBag,
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
    },
    {
      id: 'promos',
      label: 'Promo Codes',
      icon: Tag,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
    },
    {
      id: 'deliveries',
      label: 'Deliveries',
      icon: Truck,
    },
    {
      id: 'payment_methods',
      label: 'Payment Methods',
      icon: Smartphone,
    },
  ];

  return (
    <AdminLayout
      active="store"
      permission="store"
    >
      <div className="space-y-6">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-400">
              Minecraft Store
            </p>

            <h1 className="mt-2 text-3xl font-black text-white">
              Store Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Manage products, promo codes,
              customer orders and Minecraft
              deliveries from one dashboard.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.07] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />

              Refresh
            </button>

            {activeTab ===
              'products' && (
              <button
                onClick={
                  openCreateProduct
                }
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/20 hover:bg-purple-500"
              >
                <Plus className="h-4 w-4" />

                Add Product
              </button>
            )}

            {activeTab ===
              'promos' && (
              <button
                onClick={
                  openCreatePromo
                }
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/20 hover:bg-purple-500"
              >
                <Plus className="h-4 w-4" />

                Create Promo
              </button>
            )}
          </div>
        </div>

        {/* ==========================================
            TABS
        ========================================== */}

        <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);

                  if (
                    tab.id ===
                    'payment_methods'
                  ) {
                    setSearch('');
                  }
                }}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-slate-500 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />

                {tab.label}

                {tab.id ===
                  'orders' &&
                  pendingOrders >
                    0 && (
                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400">
                      {pendingOrders}
                    </span>
                  )}

                {tab.id ===
                  'deliveries' &&
                  deliveries.filter(
                    (item) =>
                      item.status !==
                      'completed'
                  ).length >
                    0 && (
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
                      {
                        deliveries.filter(
                          (item) =>
                            item.status !==
                            'completed'
                        ).length
                      }
                    </span>
                  )}
              </button>
            );
          })}
        </div>

        {/* ==========================================
            SEARCH
        ========================================== */}

        {activeTab !== 'overview' &&
          activeTab !== 'payment_methods' && (
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={
                  activeTab ===
                  'products'
                    ? 'Search products...'
                    : activeTab ===
                      'promos'
                    ? 'Search promo codes...'
                    : activeTab ===
                      'orders'
                    ? 'Search order, player, product or transaction...'
                    : 'Search player or order...'
                }
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-purple-500/40"
              />
            </div>
          )}

        {/* ==========================================
            PAYMENT METHODS
        ========================================== */}

        {activeTab ===
          'payment_methods' && (
          <AdminStorePaymentMethods />
        )}

        {/* ==========================================
            COMMON CONTENT
        ========================================== */}

        {activeTab !==
          'payment_methods' && (
          <>
            {loading ? (
              <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-400" />

                  Loading Store...
                </div>
              </div>
            ) : (
              <>

                {/* ======================================
                    OVERVIEW
                ====================================== */}

                {activeTab ===
                  'overview' && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                      <StatCard
                        label="Products"
                        value={
                          products.length
                        }
                        icon={
                          <Package className="h-5 w-5" />
                        }
                      />

                      <StatCard
                        label="Active Promos"
                        value={
                          activePromos
                        }
                        icon={
                          <Tag className="h-5 w-5" />
                        }
                      />

                      <StatCard
                        label="Pending Orders"
                        value={
                          pendingOrders
                        }
                        icon={
                          <Clock3 className="h-5 w-5" />
                        }
                      />

                      <StatCard
                        label="Revenue"
                        value={formatMoney(
                          totalRevenue
                        )}
                        icon={
                          <Coins className="h-5 w-5" />
                        }
                      />

                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="font-bold text-white">
                              Order Activity
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                              Current store order status
                            </p>
                          </div>

                          <ShoppingBag className="h-5 w-5 text-purple-400" />
                        </div>

                        <div className="mt-6 space-y-3">

                          <SummaryRow
                            label="Total Orders"
                            value={
                              orders.length
                            }
                          />

                          <SummaryRow
                            label="Pending Delivery"
                            value={
                              pendingOrders
                            }
                          />

                          <SummaryRow
                            label="Completed"
                            value={
                              completedOrders
                            }
                          />

                          <SummaryRow
                            label="Failed Deliveries"
                            value={
                              deliveries.filter(
                                (item) =>
                                  item.status ===
                                  'failed'
                              ).length
                            }
                          />

                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <div className="flex items-center justify-between">

                          <div>
                            <h2 className="font-bold text-white">
                              Recent Orders
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                              Latest store activity
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              setActiveTab(
                                'orders'
                              )
                            }
                            className="text-xs font-bold text-purple-400 hover:text-purple-300"
                          >
                            View All
                          </button>
                        </div>

                        <div className="mt-5 space-y-3">

                          {orders
                            .slice(0, 5)
                            .map(
                              (
                                order
                              ) => (
                                <button
                                  key={
                                    order.id
                                  }
                                  onClick={() =>
                                    setSelectedOrder(
                                      order
                                    )
                                  }
                                  className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left hover:bg-white/[0.05]"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-white">
                                      {
                                        order.order_number
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {
                                        order.player_username
                                      }
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-sm font-bold text-white">
                                      {formatMoney(
                                        Number(
                                          order.final_amount
                                        )
                                      )}
                                    </p>

                                    <StatusBadge
                                      status={
                                        order.payment_status
                                      }
                                    />
                                  </div>
                                </button>
                              )
                            )}

                          {orders.length ===
                            0 && (
                            <EmptyState text="No orders yet." />
                          )}

                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* ======================================
                    PRODUCTS
                ====================================== */}

                {activeTab ===
                  'products' && (
                  <div className="grid gap-5 xl:grid-cols-2">

                    {filteredProducts.map(
                      (product) => {
                        const Icon =
                          getCategoryIcon(
                            product.category
                          );

                        return (
                          <div
                            key={
                              product.id
                            }
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                          >

                            <div className="flex gap-4">

                              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-purple-500/20 bg-purple-500/10">

                                {product.image_url ? (
                                  <img
                                    src={
                                      product.image_url
                                    }
                                    alt={
                                      product.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Icon className="h-7 w-7 text-purple-300" />
                                )}

                              </div>

                              <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center gap-2">

                                  <h2 className="font-bold text-white">
                                    {
                                      product.name
                                    }
                                  </h2>

                                  <StatusBadge
                                    status={
                                      product.is_active
                                        ? 'active'
                                        : 'hidden'
                                    }
                                  />

                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    product.category
                                  }{' '}
                                  ·{' '}
                                  {
                                    product.slug
                                  }
                                </p>

                                <p className="mt-2 text-xl font-black text-white">
                                  {formatMoney(
                                    Number(
                                      product.price
                                    ),
                                    product.currency
                                  )}
                                </p>

                              </div>
                            </div>

                            {product.description && (
                              <p className="mt-4 text-sm leading-6 text-slate-400">
                                {
                                  product.description
                                }
                              </p>
                            )}

                            {product.features?.length >
                              0 && (
                              <div className="mt-4">

                                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                  Features
                                </p>

                                <div className="grid gap-1 sm:grid-cols-2">

                                  {product.features
                                    .slice(
                                      0,
                                      6
                                    )
                                    .map(
                                      (
                                        feature,
                                        index
                                      ) => (
                                        <div
                                          key={`${product.id}-${index}`}
                                          className="flex items-start gap-2 text-xs text-slate-300"
                                        >
                                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />

                                          {
                                            feature
                                          }
                                        </div>
                                      )
                                    )}

                                </div>
                              </div>
                            )}

                            <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-3">

                              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Minecraft Commands
                              </p>

                              {product.minecraft_commands?.length >
                              0 ? (
                                <div className="space-y-1">

                                  {product.minecraft_commands.map(
                                    (
                                      command,
                                      index
                                    ) => (
                                      <code
                                        key={
                                          index
                                        }
                                        className="block overflow-x-auto rounded-lg bg-black/30 px-3 py-2 text-xs text-purple-300"
                                      >
                                        {
                                          command
                                        }
                                      </code>
                                    )
                                  )}

                                </div>
                              ) : (
                                <span className="text-xs text-slate-600">
                                  No commands configured
                                </span>
                              )}

                            </div>

                            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">

                              <button
                                onClick={() =>
                                  openEditProduct(
                                    product
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06] hover:text-white"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  toggleProduct(
                                    product
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06] hover:text-white"
                              >
                                {product.is_active ? (
                                  <>
                                    <EyeOff className="h-3.5 w-3.5" />
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3.5 w-3.5" />
                                    Activate
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  deleteProduct(
                                    product
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>

                            </div>

                          </div>
                        );
                      }
                    )}

                    {filteredProducts.length ===
                      0 && (
                      <div className="xl:col-span-2">
                        <EmptyState text="No products found." />
                      </div>
                    )}

                  </div>
                )}

                {/* ======================================
                    PROMOS
                ====================================== */}

                {activeTab ===
                  'promos' && (
                  <div className="space-y-4">

                    {filteredPromos.map(
                      (promo) => {
                        const product =
                          products.find(
                            (item) =>
                              item.id ===
                              promo.product_id
                          );

                        return (
                          <div
                            key={
                              promo.id
                            }
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                          >

                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                              <div className="flex items-start gap-4">

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10">
                                  <Tag className="h-5 w-5 text-green-400" />
                                </div>

                                <div>

                                  <div className="flex flex-wrap items-center gap-2">

                                    <h2 className="font-mono text-lg font-black text-white">
                                      {
                                        promo.code
                                      }
                                    </h2>

                                    <StatusBadge
                                      status={
                                        promo.is_active
                                          ? 'active'
                                          : 'inactive'
                                      }
                                    />

                                  </div>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {product
                                      ? product.name
                                      : 'All Products'}
                                  </p>

                                </div>

                              </div>

                              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:min-w-[520px]">

                                <MiniStat
                                  label="Discount"
                                  value={
                                    promo.discount_type ===
                                    'free'
                                      ? 'FREE'
                                      : promo.discount_type ===
                                        'percentage'
                                      ? `${promo.discount_value}%`
                                      : formatMoney(
                                          promo.discount_value
                                        )
                                  }
                                />

                                <MiniStat
                                  label="Used"
                                  value={`${promo.used_count}${
                                    promo.max_uses
                                      ? ` / ${promo.max_uses}`
                                      : ''
                                  }`}
                                />

                                <MiniStat
                                  label="Expires"
                                  value={
                                    promo.expires_at
                                      ? new Date(
                                          promo.expires_at
                                        ).toLocaleDateString()
                                      : 'Never'
                                  }
                                />

                                <MiniStat
                                  label="Status"
                                  value={
                                    promo.is_active
                                      ? 'Active'
                                      : 'Off'
                                  }
                                />

                              </div>
                            </div>

                            <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">

                              <button
                                onClick={() =>
                                  openEditPromo(
                                    promo
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  togglePromo(
                                    promo
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06]"
                              >
                                {promo.is_active
                                  ? 'Disable'
                                  : 'Activate'}
                              </button>

                              <button
                                onClick={() =>
                                  deletePromo(
                                    promo
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>

                            </div>

                          </div>
                        );
                      }
                    )}

                    {filteredPromos.length ===
                      0 && (
                      <EmptyState text="No promo codes found." />
                    )}

                  </div>
                )}

                {/* ======================================
                    ORDERS
                ====================================== */}

                {activeTab ===
                  'orders' && (
                  <div className="space-y-4">

                    <div className="flex flex-wrap gap-2">

                      {[
                        'all',
                        'pending',
                        'paid',
                        'failed',
                        'refunded',
                        'processing',
                        'completed',
                      ].map(
                        (status) => (
                          <button
                            key={
                              status
                            }
                            onClick={() =>
                              setOrderStatusFilter(
                                status
                              )
                            }
                            className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize ${
                              orderStatusFilter ===
                              status
                                ? 'border-purple-400/30 bg-purple-500/10 text-white'
                                : 'border-white/10 text-slate-500 hover:text-white'
                            }`}
                          >
                            {status}
                          </button>
                        )
                      )}

                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

                      <div className="overflow-x-auto">

                        <table className="w-full min-w-[1100px] text-left">

                          <thead className="border-b border-white/10 bg-white/[0.02]">

                            <tr>

                              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Order
                              </th>

                              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Player
                              </th>

                              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Product
                              </th>

                              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Amount
                              </th>

                              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Payment
                              </th>

                              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Delivery
                              </th>

                              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Date
                              </th>

                              <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Action
                              </th>

                            </tr>

                          </thead>

                          <tbody>

                            {filteredOrders.map(
                              (order) => (
                                <tr
                                  key={
                                    order.id
                                  }
                                  className="border-b border-white/5 hover:bg-white/[0.03]"
                                >

                                  <td className="px-5 py-4">

                                    <button
                                      onClick={() =>
                                        setSelectedOrder(
                                          order
                                        )
                                      }
                                      className="font-mono text-xs font-bold text-purple-300 hover:text-purple-200"
                                    >
                                      {
                                        order.order_number
                                      }
                                    </button>

                                  </td>

                                  <td className="px-5 py-4">

                                    <div className="flex items-center gap-2">

                                      <User className="h-4 w-4 text-slate-600" />

                                      <span className="text-sm font-semibold text-white">
                                        {
                                          order.player_username
                                        }
                                      </span>

                                    </div>

                                  </td>

                                  <td className="px-5 py-4">

                                    <span className="text-sm text-slate-300">
                                      {order
                                        .product
                                        ?.name ||
                                        'Deleted Product'}
                                    </span>

                                  </td>

                                  <td className="px-5 py-4">

                                    <span className="font-bold text-white">
                                      {formatMoney(
                                        Number(
                                          order.final_amount
                                        )
                                      )}
                                    </span>

                                    {Number(
                                      order.discount_amount
                                    ) > 0 && (
                                      <span className="ml-2 text-xs text-green-400">
                                        -
                                        {formatMoney(
                                          Number(
                                            order.discount_amount
                                          )
                                        )}
                                      </span>
                                    )}

                                  </td>

                                  <td className="px-5 py-4">
                                    <StatusBadge
                                      status={
                                        order.payment_status
                                      }
                                    />
                                  </td>

                                  <td className="px-5 py-4">
                                    <StatusBadge
                                      status={
                                        order.delivery_status
                                      }
                                    />
                                  </td>

                                  <td className="px-5 py-4 text-xs text-slate-500">
                                    {formatDate(
                                      order.created_at
                                    )}
                                  </td>

                                  <td className="px-5 py-4 text-right">

                                    <button
                                      onClick={() =>
                                        setSelectedOrder(
                                          order
                                        )
                                      }
                                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.07] hover:text-white"
                                    >
                                      <Eye className="h-3.5 w-3.5" />

                                      View
                                    </button>

                                  </td>

                                </tr>
                              )
                            )}

                          </tbody>

                        </table>

                      </div>

                      {filteredOrders.length ===
                        0 && (
                        <EmptyState text="No orders found." />
                      )}

                    </div>

                  </div>
                )}

                {/* ======================================
                    DELIVERIES
                ====================================== */}

                {activeTab ===
                  'deliveries' && (
                  <div className="space-y-4">

                    <div className="flex flex-wrap gap-2">

                      {[
                        'all',
                        'pending',
                        'processing',
                        'completed',
                        'failed',
                      ].map(
                        (status) => (
                          <button
                            key={
                              status
                            }
                            onClick={() =>
                              setDeliveryStatusFilter(
                                status
                              )
                            }
                            className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize ${
                              deliveryStatusFilter ===
                              status
                                ? 'border-purple-400/30 bg-purple-500/10 text-white'
                                : 'border-white/10 text-slate-500 hover:text-white'
                            }`}
                          >
                            {status}
                          </button>
                        )
                      )}

                    </div>

                    <div className="grid gap-4">

                      {filteredDeliveries.map(
                        (delivery) => (
                          <div
                            key={
                              delivery.id
                            }
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                          >

                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                              <div>

                                <div className="flex flex-wrap items-center gap-2">

                                  <span className="font-mono text-sm font-black text-purple-300">
                                    {delivery
                                      .order
                                      ?.order_number ||
                                      delivery.order_id}
                                  </span>

                                  <StatusBadge
                                    status={
                                      delivery.status
                                    }
                                  />

                                </div>

                                <div className="mt-3 flex flex-wrap gap-4 text-sm">

                                  <span className="text-slate-400">
                                    Player:{' '}
                                    <strong className="text-white">
                                      {
                                        delivery.player_username
                                      }
                                    </strong>
                                  </span>

                                  <span className="text-slate-400">
                                    Attempts:{' '}
                                    <strong className="text-white">
                                      {
                                        delivery.attempts
                                      }
                                    </strong>
                                  </span>

                                  <span className="text-slate-500">
                                    {formatDate(
                                      delivery.created_at
                                    )}
                                  </span>

                                </div>

                              </div>

                              <div className="flex flex-wrap gap-2">

                                {[
                                  'pending',
                                  'processing',
                                  'completed',
                                  'failed',
                                ].map(
                                  (
                                    status
                                  ) => (
                                    <button
                                      key={
                                        status
                                      }
                                      onClick={() =>
                                        updateDeliveryStatus(
                                          delivery,
                                          status as
                                            | 'pending'
                                            | 'processing'
                                            | 'completed'
                                            | 'failed'
                                        )
                                      }
                                      className={`rounded-lg border px-3 py-2 text-[11px] font-bold capitalize ${
                                        delivery.status ===
                                        status
                                          ? 'border-purple-400/30 bg-purple-500/10 text-white'
                                          : 'border-white/10 text-slate-500 hover:text-white'
                                      }`}
                                    >
                                      {status}
                                    </button>
                                  )
                                )}

                              </div>

                            </div>

                            <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4">

                              <div className="mb-2 flex items-center justify-between">

                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                  Commands
                                </span>

                                <span className="text-[10px] text-slate-600">
                                  {delivery.commands
                                    ?.length ||
                                    0}{' '}
                                  command(s)
                                </span>

                              </div>

                              {delivery.commands?.length >
                              0 ? (
                                <div className="space-y-1">

                                  {delivery.commands.map(
                                    (
                                      command,
                                      index
                                    ) => (
                                      <code
                                        key={
                                          index
                                        }
                                        className="block overflow-x-auto rounded-lg bg-black/30 px-3 py-2 text-xs text-green-300"
                                      >
                                        {
                                          command
                                        }
                                      </code>
                                    )
                                  )}

                                </div>
                              ) : (
                                <span className="text-xs text-slate-600">
                                  No commands.
                                </span>
                              )}

                            </div>

                            {delivery.error_message && (
                              <div className="mt-4 rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-xs text-red-300">
                                <strong>
                                  Error:
                                </strong>{' '}
                                {
                                  delivery.error_message
                                }
                              </div>
                            )}

                            <div className="mt-4 flex justify-end">

                              <button
                                onClick={() =>
                                  setSelectedDelivery(
                                    delivery
                                  )
                                }
                                className="text-xs font-bold text-purple-400 hover:text-purple-300"
                              >
                                View Details
                              </button>

                            </div>

                          </div>
                        )
                      )}

                      {filteredDeliveries.length ===
                        0 && (
                        <EmptyState text="No deliveries found." />
                      )}

                    </div>
                  </div>
                )}

              </>
            )}
          </>
        )}

        {/* ==========================================
            PRODUCT MODAL
        ========================================== */}

        {productEditor && (
          <Modal
            title={
              editingProductId
                ? 'Edit Product'
                : 'Create Product'
            }
            onClose={() => {
              if (!savingProduct) {
                setProductEditor(
                  false
                );
              }
            }}
          >
            <form
              onSubmit={saveProduct}
              className="space-y-5"
            >

              <div className="grid gap-4 sm:grid-cols-2">

                <Field
                  label="Product Name"
                  required
                >
                  <input
                    value={
                      productForm.name
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm(
                        (current) => ({
                          ...current,
                          name: event
                            .target
                            .value,
                          slug:
                            editingProductId
                              ? current.slug
                              : makeSlug(
                                  event
                                    .target
                                    .value
                                ),
                        })
                      )
                    }
                    placeholder="VIP Rank"
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Slug"
                  required
                >
                  <input
                    value={
                      productForm.slug
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm(
                        (current) => ({
                          ...current,
                          slug: makeSlug(
                            event
                              .target
                              .value
                          ),
                        })
                      )
                    }
                    placeholder="vip-rank"
                    className={inputClass}
                  />
                </Field>

              </div>

              <Field label="Description">
                <textarea
                  value={
                    productForm.description
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={3}
                  className={textareaClass}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">

                <Field label="Category">
                  <select
                    value={
                      productForm.category
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm(
                        (current) => ({
                          ...current,
                          category:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={inputClass}
                  >
                    {categories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category.value
                          }
                          value={
                            category.value
                          }
                        >
                          {
                            category.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field
                  label="Price (BDT)"
                  required
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      productForm.price
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm(
                        (current) => ({
                          ...current,
                          price:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Sort Order">
                  <input
                    type="number"
                    value={
                      productForm.sort_order
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm(
                        (current) => ({
                          ...current,
                          sort_order:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </Field>

              </div>

              <Field label="Image URL">
                <input
                  value={
                    productForm.image_url
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (current) => ({
                        ...current,
                        image_url:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="https://..."
                  className={inputClass}
                />
              </Field>

              <Field label="Features">
                <textarea
                  value={
                    productForm.features
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (current) => ({
                        ...current,
                        features:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={5}
                  placeholder={
                    'VIP prefix\nSpecial chat color\nCosmetic perks'
                  }
                  className={textareaClass}
                />

                <p className="mt-1 text-[11px] text-slate-600">
                  One feature per line.
                </p>
              </Field>

              <Field label="Minecraft Commands">
                <textarea
                  value={
                    productForm.minecraft_commands
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (current) => ({
                        ...current,
                        minecraft_commands:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={5}
                  placeholder={
                    'lp user {player} parent set vip'
                  }
                  className={`${textareaClass} font-mono`}
                />

                <p className="mt-1 text-[11px] text-slate-600">
                  One command per line.
                  Use{' '}
                  <code>
                    {'{player}'}
                  </code>{' '}
                  for the Minecraft username.
                </p>
              </Field>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">

                <input
                  type="checkbox"
                  checked={
                    productForm.is_active
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (current) => ({
                        ...current,
                        is_active:
                          event
                            .target
                            .checked,
                      })
                    )
                  }
                  className="h-4 w-4 accent-purple-500"
                />

                <div>

                  <p className="text-sm font-bold text-white">
                    Product Active
                  </p>

                  <p className="text-xs text-slate-500">
                    Active products appear in the customer Store.
                  </p>

                </div>

              </label>

              <ModalActions
                loading={
                  savingProduct
                }
                onCancel={() =>
                  setProductEditor(
                    false
                  )
                }
                submitText={
                  editingProductId
                    ? 'Save Changes'
                    : 'Create Product'
                }
              />

            </form>
          </Modal>
        )}

        {/* ==========================================
            PROMO MODAL
        ========================================== */}

        {promoEditor && (
          <Modal
            title={
              editingPromoId
                ? 'Edit Promo Code'
                : 'Create Promo Code'
            }
            onClose={() => {
              if (!savingPromo) {
                setPromoEditor(
                  false
                );
              }
            }}
          >
            <form
              onSubmit={savePromo}
              className="space-y-5"
            >

              <Field
                label="Promo Code"
                required
              >
                <input
                  value={
                    promoForm.code
                  }
                  onChange={(
                    event
                  ) =>
                    setPromoForm(
                      (current) => ({
                        ...current,
                        code: event
                          .target
                          .value
                          .toUpperCase(),
                      })
                    )
                  }
                  placeholder="BUTTERFLY20"
                  className={`${inputClass} font-mono uppercase`}
                />
              </Field>

              <Field label="Product">
                <select
                  value={
                    promoForm.product_id
                  }
                  onChange={(
                    event
                  ) =>
                    setPromoForm(
                      (current) => ({
                        ...current,
                        product_id:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    All Products
                  </option>

                  {products.map(
                    (
                      product
                    ) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {
                          product.name
                        }
                      </option>
                    )
                  )}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">

                <Field label="Discount Type">
                  <select
                    value={
                      promoForm.discount_type
                    }
                    onChange={(
                      event
                    ) =>
                      setPromoForm(
                        (current) => ({
                          ...current,
                          discount_type:
                            event
                              .target
                              .value as
                              | 'percentage'
                              | 'fixed'
                              | 'free',
                        })
                      )
                    }
                    className={inputClass}
                  >
                    <option value="percentage">
                      Percentage
                    </option>

                    <option value="fixed">
                      Fixed Amount
                    </option>

                    <option value="free">
                      Free
                    </option>
                  </select>
                </Field>

                <Field label="Discount Value">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={
                      promoForm.discount_type ===
                      'free'
                    }
                    value={
                      promoForm.discount_value
                    }
                    onChange={(
                      event
                    ) =>
                      setPromoForm(
                        (current) => ({
                          ...current,
                          discount_value:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </Field>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <Field label="Maximum Uses">
                  <input
                    type="number"
                    min="1"
                    value={
                      promoForm.max_uses
                    }
                    onChange={(
                      event
                    ) =>
                      setPromoForm(
                        (current) => ({
                          ...current,
                          max_uses:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Unlimited"
                    className={inputClass}
                  />
                </Field>

                <Field label="Expiry Date">
                  <input
                    type="datetime-local"
                    value={
                      promoForm.expires_at
                    }
                    onChange={(
                      event
                    ) =>
                      setPromoForm(
                        (current) => ({
                          ...current,
                          expires_at:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </Field>

              </div>

              <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4">

                <div className="flex items-start gap-3">

                  <Percent className="mt-0.5 h-4 w-4 text-purple-400" />

                  <p className="text-xs leading-5 text-slate-400">
                    Percentage 20 means
                    20% off. Fixed means
                    a BDT amount. Free makes
                    the order 100% discounted.
                  </p>

                </div>

              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">

                <input
                  type="checkbox"
                  checked={
                    promoForm.is_active
                  }
                  onChange={(
                    event
                  ) =>
                    setPromoForm(
                      (current) => ({
                        ...current,
                        is_active:
                          event
                            .target
                            .checked,
                      })
                    )
                  }
                  className="h-4 w-4 accent-purple-500"
                />

                <div>

                  <p className="text-sm font-bold text-white">
                    Promo Active
                  </p>

                  <p className="text-xs text-slate-500">
                    Customers can use this code.
                  </p>

                </div>

              </label>

              <ModalActions
                loading={
                  savingPromo
                }
                onCancel={() =>
                  setPromoEditor(
                    false
                  )
                }
                submitText={
                  editingPromoId
                    ? 'Save Changes'
                    : 'Create Promo'
                }
              />

            </form>
          </Modal>
        )}

        {/* ==========================================
            ORDER DETAIL MODAL
        ========================================== */}

        {selectedOrder && (
          <Modal
            title="Order Details"
            onClose={() =>
              setSelectedOrder(null)
            }
          >
            <div className="space-y-5">

              {/* ORDER HEADER */}

              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                      Order Number
                    </p>

                    <p className="mt-1 font-mono text-xl font-black text-white">
                      {
                        selectedOrder.order_number
                      }
                    </p>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    <StatusBadge
                      status={
                        selectedOrder.payment_status
                      }
                    />

                    <StatusBadge
                      status={
                        selectedOrder.delivery_status
                      }
                    />

                  </div>

                </div>

              </div>

              {/* CUSTOMER */}

              <div>

                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <User className="h-4 w-4 text-purple-400" />
                  Customer
                </h3>

                <div className="space-y-2">

                  <DetailRow
                    label="Minecraft Username"
                    value={
                      selectedOrder.player_username
                    }
                  />

                  <DetailRow
                    label="Product"
                    value={
                      selectedOrder.product
                        ?.name ||
                      'Deleted Product'
                    }
                  />

                  <DetailRow
                    label="Created"
                    value={formatDate(
                      selectedOrder.created_at
                    )}
                  />

                </div>

              </div>

              {/* PAYMENT */}

              <div>

                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <Coins className="h-4 w-4 text-purple-400" />
                  Payment Information
                </h3>

                <div className="space-y-2">

                  <DetailRow
                    label="Payment Method"
                    value={
                      selectedOrder.payment_method ||
                      'Free Order'
                    }
                  />

                  <DetailRow
                    label="Transaction ID"
                    value={
                      selectedOrder.transaction_id ||
                      '—'
                    }
                    mono
                  />

                  <DetailRow
                    label="Original Amount"
                    value={formatMoney(
                      Number(
                        selectedOrder.original_amount
                      )
                    )}
                  />

                  <DetailRow
                    label="Discount"
                    value={`-${formatMoney(
                      Number(
                        selectedOrder.discount_amount
                      )
                    )}`}
                  />

                  <div className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">

                    <span className="text-sm font-bold text-slate-300">
                      Final Amount
                    </span>

                    <span className="text-xl font-black text-white">
                      {formatMoney(
                        Number(
                          selectedOrder.final_amount
                        )
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {/* DELIVERY */}

              <div>

                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <Truck className="h-4 w-4 text-purple-400" />
                  Delivery Information
                </h3>

                <div className="space-y-2">

                  <DetailRow
                    label="Delivery Status"
                    value={
                      selectedOrder.delivery_status
                    }
                  />

                  <DetailRow
                    label="Completed At"
                    value={formatDate(
                      selectedOrder.completed_at
                    )}
                  />

                </div>

              </div>

              {/* PENDING PAYMENT */}

              {Number(
                selectedOrder.final_amount
              ) > 0 &&
                selectedOrder.payment_status ===
                  'pending' && (
                  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">

                    <div className="flex items-start gap-3">

                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />

                      <div>

                        <h3 className="font-bold text-white">
                          Payment Verification Required
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          Verify the payment and
                          transaction ID before marking
                          this order as paid.
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">

                      <button
                        onClick={() =>
                          verifyAndPayOrder(
                            selectedOrder
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-500"
                      >
                        <CheckCircle2 className="h-4 w-4" />

                        Mark as Paid
                      </button>

                      <button
                        onClick={() =>
                          failOrderPayment(
                            selectedOrder
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/20"
                      >
                        <AlertCircle className="h-4 w-4" />

                        Payment Failed
                      </button>

                    </div>

                  </div>
                )}

              {/* FREE ORDER */}

              {Number(
                selectedOrder.final_amount
              ) === 0 &&
                selectedOrder.payment_status ===
                  'paid' && (
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">

                    <div className="flex items-center gap-3">

                      <CheckCircle2 className="h-5 w-5 text-green-400" />

                      <div>

                        <h3 className="font-bold text-white">
                          Free Order
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          This order has a final amount
                          of ৳0 and does not require
                          payment verification.
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              {/* PAID */}

              {selectedOrder.payment_status ===
                'paid' &&
                Number(
                  selectedOrder.final_amount
                ) > 0 && (
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">

                    <div className="flex items-center gap-3">

                      <CheckCircle2 className="h-5 w-5 text-green-400" />

                      <div>

                        <h3 className="font-bold text-white">
                          Payment Verified
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          Payment has been verified.
                          The order is ready for delivery.
                        </p>

                      </div>

                    </div>

                    <div className="mt-4">

                      <button
                        onClick={() =>
                          refundOrder(
                            selectedOrder
                          )
                        }
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/20"
                      >
                        Mark Refunded
                      </button>

                    </div>

                  </div>
                )}

              {/* FAILED */}

              {selectedOrder.payment_status ===
                'failed' && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

                  <div className="flex items-center gap-3">

                    <AlertCircle className="h-5 w-5 text-red-400" />

                    <div>

                      <h3 className="font-bold text-white">
                        Payment Failed
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        This payment was marked as failed.
                      </p>

                    </div>

                  </div>

                  <div className="mt-4">

                    <button
                      onClick={() =>
                        updateOrderStatus(
                          selectedOrder,
                          'pending'
                        )
                      }
                      className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5"
                    >
                      Reopen Payment
                    </button>

                  </div>

                </div>
              )}

              {/* FOOTER */}

              <div className="flex justify-end border-t border-white/10 pt-5">

                <button
                  onClick={() =>
                    setSelectedOrder(null)
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  Close
                </button>

              </div>

            </div>
          </Modal>
        )}

        {/* ==========================================
            DELIVERY DETAIL MODAL
        ========================================== */}

        {selectedDelivery && (
          <Modal
            title="Delivery Details"
            onClose={() =>
              setSelectedDelivery(
                null
              )
            }
          >
            <div className="space-y-4">

              <DetailRow
                label="Order"
                value={
                  selectedDelivery
                    .order
                    ?.order_number ||
                  selectedDelivery.order_id
                }
                mono
              />

              <DetailRow
                label="Player"
                value={
                  selectedDelivery.player_username
                }
              />

              <DetailRow
                label="Status"
                value={
                  selectedDelivery.status
                }
              />

              <DetailRow
                label="Attempts"
                value={String(
                  selectedDelivery.attempts
                )}
              />

              <DetailRow
                label="Created"
                value={formatDate(
                  selectedDelivery.created_at
                )}
              />

              <DetailRow
                label="Delivered"
                value={formatDate(
                  selectedDelivery.delivered_at
                )}
              />

              <div>

                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Minecraft Commands
                </p>

                <div className="space-y-2">

                  {selectedDelivery.commands?.map(
                    (
                      command,
                      index
                    ) => (
                      <code
                        key={
                          index
                        }
                        className="block overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-green-300"
                      >
                        {
                          command
                        }
                      </code>
                    )
                  )}

                </div>

              </div>

              {selectedDelivery.error_message && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">

                  <strong>
                    Error:
                  </strong>{' '}

                  {
                    selectedDelivery.error_message
                  }

                </div>
              )}

            </div>
          </Modal>
        )}

      </div>
    </AdminLayout>
  );
};

/* ============================================
   SMALL COMPONENTS
============================================ */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">

        {label}

        {required && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}

      </span>

      {children}

    </label>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <div className="flex items-center justify-between">

        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {label}
        </span>

        <span className="text-purple-400">
          {icon}
        </span>

      </div>

      <p className="mt-3 text-2xl font-black text-white">
        {value}
      </p>

    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">

      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="font-bold text-white">
        {value}
      </span>

    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-white">
        {value}
      </p>

    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span
        className={`max-w-[65%] break-all text-right text-sm font-semibold text-white ${
          mono
            ? 'font-mono text-purple-300'
            : ''
        }`}
      >
        {value}
      </span>

    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">

      <Package className="mx-auto h-9 w-9 text-slate-700" />

      <p className="mt-3 text-sm text-slate-500">
        {text}
      </p>

    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b12] shadow-2xl">

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">

          <h2 className="text-lg font-black text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        <div className="max-h-[calc(92vh-72px)] overflow-y-auto p-6">
          {children}
        </div>

      </div>

    </div>
  );
}

function ModalActions({
  loading,
  onCancel,
  submitText,
}: {
  loading: boolean;
  onCancel: () => void;
  submitText: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-white/10 pt-5">

      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-400 hover:text-white disabled:opacity-40"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50"
      >

        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {submitText}

      </button>

    </div>
  );
}