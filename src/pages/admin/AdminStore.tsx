import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Coins,
  Crown,
  Eye,
  EyeOff,
  FolderTree,
  ImageIcon,
  KeyRound,
  Loader2,
  Package,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
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
  | 'categories'
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

interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  sort_order: number;
  is_active: boolean;
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

interface CategoryForm {
  name: string;
  slug: string;
  icon_url: string;
  sort_order: string;
  is_active: boolean;
}

const EMPTY_PRODUCT: ProductForm = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  category: '',
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

const EMPTY_CATEGORY: CategoryForm = {
  name: '',
  slug: '',
  icon_url: '',
  sort_order: '0',
  is_active: true,
};

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

function formatMoney(amount: number, currency = 'BDT') {
  const symbol = currency === 'BDT' || currency === '৳' ? '৳' : currency;
  return `${symbol}${Number(amount).toLocaleString()}`;
}

function getFallbackCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'ranks':
    case 'rank':
      return Crown;
    case 'keys':
    case 'key':
      return KeyRound;
    case 'coins':
    case 'coin':
      return Coins;
    case 'wings':
    case 'wing':
      return Sparkles;
    default:
      return Package;
  }
}

function statusClass(status: string) {
  switch (status) {
    case 'completed':
    case 'paid':
    case 'active':
      return 'border-green-500/20 bg-green-500/10 text-green-400';
    case 'failed':
    case 'refunded':
      return 'border-red-500/20 bg-red-500/10 text-red-400';
    default:
      return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400';
  }
}

function StatusBadge({ status }: { status: string }) {
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

function CategoryIcon({
  category,
  className = 'h-5 w-5',
}: {
  category?: StoreCategory;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (category?.icon_url && !imageError) {
    return (
      <img
        src={category.icon_url}
        alt=""
        className={`${className} rounded-md object-contain`}
        onError={() => setImageError(true)}
      />
    );
  }

  const Icon = getFallbackCategoryIcon(category?.slug || 'other');
  return <Icon className={className} />;
}

function ImagePreview({ url }: { url: string }) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return <ImageIcon className="h-6 w-6" />;
  }

  return (
    <img
      src={url}
      alt="Preview"
      className="h-10 w-10 rounded-lg object-contain"
      onError={() => setError(true)}
    />
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-700 focus:border-purple-500/40 focus:bg-black/30 focus:ring-2 focus:ring-purple-500/10';

const textareaClass =
  'w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-700 focus:border-purple-500/40 focus:bg-black/30 focus:ring-2 focus:ring-purple-500/10';

const buttonClass =
  'transition-all duration-200 active:scale-[0.98]';

export const AdminStore: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<StoreTab>('overview');
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [deliveries, setDeliveries] = useState<StoreDelivery[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [realtimeState, setRealtimeState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  const [paymentEditorOpen, setPaymentEditorOpen] = useState(false);
  const [paymentMethodDraft, setPaymentMethodDraft] = useState('');
  const [transactionIdDraft, setTransactionIdDraft] = useState('');
  const [savingPaymentDetails, setSavingPaymentDetails] = useState(false);
  const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [productEditor, setProductEditor] = useState(false);
  const [categoryEditor, setCategoryEditor] = useState(false);
  const [promoEditor, setPromoEditor] = useState(false);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState<ProductForm>(EMPTY_PRODUCT);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [promoForm, setPromoForm] = useState<PromoForm>(EMPTY_PROMO);

  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);

  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderDeliveryFilter, setOrderDeliveryFilter] = useState('all');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');

  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<StoreDelivery | null>(null);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);

    const [
      productsResult,
      categoriesResult,
      promosResult,
      ordersResult,
      deliveriesResult,
    ] = await Promise.all([
      supabase
        .from('store_products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('store_categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('store_promo_codes')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('store_orders')
        .select(`*, product:store_products(name)`)
        .order('created_at', { ascending: false }),
      supabase
        .from('store_deliveries')
        .select(`*, order:store_orders(order_number)`)
        .order('created_at', { ascending: false }),
    ]);

    if (productsResult.error) {
      showToast('Products Error', productsResult.error.message, 'error');
    }
    if (categoriesResult.error) {
      showToast('Categories Error', categoriesResult.error.message, 'error');
    }
    if (promosResult.error) {
      showToast('Promo Codes Error', promosResult.error.message, 'error');
    }
    if (ordersResult.error) {
      showToast('Orders Error', ordersResult.error.message, 'error');
    }
    if (deliveriesResult.error) {
      showToast('Deliveries Error', deliveriesResult.error.message, 'error');
    }

    setProducts((productsResult.data || []) as StoreProduct[]);
    setCategories((categoriesResult.data || []) as StoreCategory[]);
    setPromos((promosResult.data || []) as PromoCode[]);
    setOrders((ordersResult.data || []) as StoreOrder[]);

    setDeliveries(
      (deliveriesResult.data || []) as StoreDelivery[]
    );

    if (!silent) setLoading(false);
  };

  const scheduleRealtimeReload = () => {
    if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
    realtimeTimerRef.current = setTimeout(() => loadAll(true), 180);
  };

  useEffect(() => {
    loadAll();

    const channel = supabase
      .channel('admin-store-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_categories' }, scheduleRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_products' }, scheduleRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_promo_codes' }, scheduleRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_orders' }, scheduleRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_deliveries' }, scheduleRealtimeReload)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeState('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setRealtimeState('disconnected');
        else setRealtimeState('connecting');
      });

    return () => {
      if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!selectedOrder) return;
    const latest = orders.find((item) => item.id === selectedOrder.id);
    if (!latest) {
      setSelectedOrder(null);
      return;
    }
    setSelectedOrder(latest);
  }, [orders]);

  useEffect(() => {
    if (!selectedDelivery) return;
    const latest = deliveries.find((item) => item.id === selectedDelivery.id);
    if (!latest) {
      setSelectedDelivery(null);
      return;
    }
    setSelectedDelivery(latest);
  }, [deliveries]);

  const refresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const openOrderDetails = (order: StoreOrder) => {
    setSelectedOrder(order);
    setPaymentEditorOpen(false);
    setPaymentMethodDraft(order.payment_method || '');
    setTransactionIdDraft(order.transaction_id || '');
  };

  const getOrderForDelivery = (delivery: StoreDelivery) =>
    orders.find((order) => order.id === delivery.order_id) || null;

  const getCategoryBySlug = (slug: string) =>
    categories.find((category) => category.slug === slug) || null;

  /* ==========================================
     PRODUCTS
  ========================================== */

  const openCreateProduct = () => {
    setEditingProductId(null);
    setProductForm({
      ...EMPTY_PRODUCT,
      category:
        categories.find((item) => item.is_active)?.slug ||
        categories[0]?.slug ||
        '',
    });
    setProductEditor(true);
  };

  const openEditProduct = (product: StoreProduct) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      image_url: product.image_url || '',
      category: product.category || '',
      price: String(product.price),
      features: Array.isArray(product.features) ? product.features.join('\n') : '',
      minecraft_commands: Array.isArray(product.minecraft_commands)
        ? product.minecraft_commands.join('\n')
        : '',
      is_active: product.is_active,
      sort_order: String(product.sort_order),
    });
    setProductEditor(true);
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!productForm.name.trim()) {
      showToast('Product Error', 'Product name is required.', 'error');
      return;
    }
    if (!productForm.slug.trim()) {
      showToast('Product Error', 'Product slug is required.', 'error');
      return;
    }
    if (!productForm.category.trim()) {
      showToast('Product Error', 'Select a category.', 'error');
      return;
    }

    const price = Number(productForm.price);
    if (Number.isNaN(price) || price < 0) {
      showToast('Product Error', 'Enter a valid price.', 'error');
      return;
    }

    setSavingProduct(true);

    const payload = {
      name: productForm.name.trim(),
      slug: productForm.slug.trim(),
      description: productForm.description.trim() || null,
      image_url: productForm.image_url.trim() || null,
      category: productForm.category.trim(),
      price,
      currency: 'BDT',
      features: productForm.features
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      minecraft_commands: productForm.minecraft_commands
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      is_active: productForm.is_active,
      sort_order: Number(productForm.sort_order) || 0,
    };

    const result = editingProductId
      ? await supabase
          .from('store_products')
          .update(payload)
          .eq('id', editingProductId)
      : await supabase.from('store_products').insert(payload);

    if (result.error) {
      showToast('Product Error', result.error.message, 'error');
      setSavingProduct(false);
      return;
    }

    showToast(
      'Success',
      editingProductId ? 'Product updated.' : 'Product created.',
      'success'
    );

    setSavingProduct(false);
    setProductEditor(false);
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT);
    await loadAll();
  };

  const deleteProduct = async (product: StoreProduct) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;

    const { error } = await supabase
      .from('store_products')
      .delete()
      .eq('id', product.id);

    if (error) {
      showToast('Delete Failed', error.message, 'error');
      return;
    }

    showToast('Product Deleted', `${product.name} was deleted.`, 'success');
    await loadAll();
  };

  const toggleProduct = async (product: StoreProduct) => {
    const { error } = await supabase
      .from('store_products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (error) {
      showToast('Update Failed', error.message, 'error');
      return;
    }

    await loadAll();
  };

  /* ==========================================
     CATEGORIES
  ========================================== */

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({
      ...EMPTY_CATEGORY,
      sort_order: String(categories.length * 10),
    });
    setCategoryEditor(true);
  };

  const openEditCategory = (category: StoreCategory) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      icon_url: category.icon_url || '',
      sort_order: String(category.sort_order),
      is_active: category.is_active,
    });
    setCategoryEditor(true);
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = categoryForm.name.trim();
    const slug = makeSlug(categoryForm.slug || name);

    if (!name) {
      showToast('Category Error', 'Category name is required.', 'error');
      return;
    }

    if (!slug) {
      showToast(
        'Category Error',
        'Enter an English slug such as ranks or skyblock.',
        'error'
      );
      return;
    }

    const duplicate = categories.find(
      (item) => item.slug === slug && item.id !== editingCategoryId
    );

    if (duplicate) {
      showToast('Category Error', 'This category slug already exists.', 'error');
      return;
    }

    setSavingCategory(true);

    const payload = {
      name,
      slug,
      icon_url: categoryForm.icon_url.trim() || null,
      sort_order: Number(categoryForm.sort_order) || 0,
      is_active: categoryForm.is_active,
    };

    const result = editingCategoryId
      ? await supabase
          .from('store_categories')
          .update(payload)
          .eq('id', editingCategoryId)
      : await supabase.from('store_categories').insert(payload);

    if (result.error) {
      showToast('Category Error', result.error.message, 'error');
      setSavingCategory(false);
      return;
    }

    showToast(
      'Success',
      editingCategoryId ? 'Category updated.' : 'Category created.',
      'success'
    );

    setSavingCategory(false);
    setCategoryEditor(false);
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY);
    await loadAll();
  };

  const toggleCategory = async (category: StoreCategory) => {
    const { error } = await supabase
      .from('store_categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id);

    if (error) {
      showToast('Category Update Failed', error.message, 'error');
      return;
    }

    await loadAll();
  };

  const deleteCategory = async (category: StoreCategory) => {
    const usageCount = products.filter(
      (product) => product.category === category.slug
    ).length;

    if (usageCount > 0) {
      showToast(
        'Category In Use',
        `${usageCount} product(s) use this category. Disable it instead of deleting it.`,
        'error'
      );
      return;
    }

    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    const { error } = await supabase
      .from('store_categories')
      .delete()
      .eq('id', category.id);

    if (error) {
      showToast('Delete Failed', error.message, 'error');
      return;
    }

    showToast('Category Deleted', `${category.name} was deleted.`, 'success');
    await loadAll();
  };

  /* ==========================================
     PROMOS
  ========================================== */

  const openCreatePromo = () => {
    setEditingPromoId(null);
    setPromoForm(EMPTY_PROMO);
    setPromoEditor(true);
  };

  const openEditPromo = (promo: PromoCode) => {
    setEditingPromoId(promo.id);
    setPromoForm({
      code: promo.code,
      product_id: promo.product_id || '',
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      max_uses: promo.max_uses === null ? '' : String(promo.max_uses),
      expires_at: promo.expires_at
        ? new Date(promo.expires_at).toISOString().slice(0, 16)
        : '',
      is_active: promo.is_active,
    });
    setPromoEditor(true);
  };

  const savePromo = async (event: React.FormEvent) => {
    event.preventDefault();

    const code = promoForm.code.trim().toUpperCase();
    if (!code) {
      showToast('Promo Error', 'Promo code is required.', 'error');
      return;
    }

    const discountValue =
      promoForm.discount_type === 'free'
        ? 0
        : Number(promoForm.discount_value);

    if (Number.isNaN(discountValue) || discountValue < 0) {
      showToast('Promo Error', 'Enter a valid discount value.', 'error');
      return;
    }

    if (promoForm.discount_type === 'percentage' && discountValue > 100) {
      showToast(
        'Promo Error',
        'Percentage discount cannot exceed 100%.',
        'error'
      );
      return;
    }

    const maxUses = promoForm.max_uses.trim()
      ? Number(promoForm.max_uses)
      : null;

    if (
      maxUses !== null &&
      (!Number.isInteger(maxUses) || maxUses < 1)
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
      product_id: promoForm.product_id || null,
      discount_type: promoForm.discount_type,
      discount_value: discountValue,
      max_uses: maxUses,
      expires_at: promoForm.expires_at
        ? new Date(promoForm.expires_at).toISOString()
        : null,
      is_active: promoForm.is_active,
    };

    const result = editingPromoId
      ? await supabase
          .from('store_promo_codes')
          .update(payload)
          .eq('id', editingPromoId)
      : await supabase.from('store_promo_codes').insert(payload);

    if (result.error) {
      showToast('Promo Error', result.error.message, 'error');
      setSavingPromo(false);
      return;
    }

    showToast(
      'Success',
      editingPromoId ? 'Promo code updated.' : 'Promo code created.',
      'success'
    );

    setSavingPromo(false);
    setPromoEditor(false);
    setEditingPromoId(null);
    setPromoForm(EMPTY_PROMO);
    await loadAll();
  };

  const deletePromo = async (promo: PromoCode) => {
    if (!window.confirm(`Delete promo code "${promo.code}"?`)) return;

    const { error } = await supabase
      .from('store_promo_codes')
      .delete()
      .eq('id', promo.id);

    if (error) {
      showToast('Delete Failed', error.message, 'error');
      return;
    }

    showToast('Promo Deleted', `${promo.code} was deleted.`, 'success');
    await loadAll();
  };

  const togglePromo = async (promo: PromoCode) => {
    const { error } = await supabase
      .from('store_promo_codes')
      .update({ is_active: !promo.is_active })
      .eq('id', promo.id);

    if (error) {
      showToast('Update Failed', error.message, 'error');
      return;
    }

    await loadAll();
  };

  /* ==========================================
     ORDERS / PAYMENTS
  ========================================== */

  const updateOrderStatus = async (
    order: StoreOrder,
    status: 'pending' | 'paid' | 'failed' | 'refunded'
  ) => {
    const nextDeliveryStatus =
      status === 'paid'
        ? order.delivery_status === 'completed'
          ? 'completed'
          : 'pending'
        : order.delivery_status;

    const { error } = await supabase
      .from('store_orders')
      .update({
        payment_status: status,
        delivery_status: nextDeliveryStatus,
      })
      .eq('id', order.id);

    if (error) {
      showToast('Order Update Failed', error.message, 'error');
      return false;
    }

    showToast(
      'Order Updated',
      `Payment status changed to ${status}.`,
      'success'
    );

    await loadAll(true);

    if (selectedOrder?.id === order.id) {
      setSelectedOrder((current) =>
        current
          ? {
              ...current,
              payment_status: status,
              delivery_status: nextDeliveryStatus,
            }
          : current
      );
    }

    return true;
  };

  const verifyAndPayOrder = async (order: StoreOrder) => {
    if (Number(order.final_amount) > 0 && !order.transaction_id?.trim()) {
      showToast('Payment Verification', 'Add the transaction ID before marking this order as paid.', 'error');
      return;
    }

    if (Number(order.final_amount) > 0 && !order.payment_method?.trim()) {
      showToast('Payment Verification', 'Add the payment method before marking this order as paid.', 'error');
      return;
    }

    const success = await updateOrderStatus(order, 'paid');
    if (success) setSelectedOrder(null);
  };

  const failOrderPayment = async (order: StoreOrder) => {
    const success = await updateOrderStatus(order, 'failed');
    if (success) setSelectedOrder(null);
  };

  const refundOrder = async (order: StoreOrder) => {
    if (!window.confirm(`Mark order ${order.order_number} as refunded?`)) return;

    const success = await updateOrderStatus(order, 'refunded');
    if (success) setSelectedOrder(null);
  };

  const savePaymentDetails = async () => {
    if (!selectedOrder) return;

    const paymentMethod = paymentMethodDraft.trim() || null;
    const transactionId = transactionIdDraft.trim() || null;

    if (Number(selectedOrder.final_amount) > 0) {
      if (!paymentMethod) {
        showToast('Payment Details', 'Payment method is required for a paid order.', 'error');
        return;
      }
      if (!transactionId || transactionId.length < 3) {
        showToast('Payment Details', 'Transaction ID must contain at least 3 characters.', 'error');
        return;
      }
    }

    setSavingPaymentDetails(true);

    const { error } = await supabase
      .from('store_orders')
      .update({ payment_method: paymentMethod, transaction_id: transactionId })
      .eq('id', selectedOrder.id);

    if (error) {
      showToast('Payment Details Error', error.message, 'error');
      setSavingPaymentDetails(false);
      return;
    }

    showToast('Payment Details Updated', 'Payment method and transaction ID saved.', 'success');
    setSavingPaymentDetails(false);
    setPaymentEditorOpen(false);
    await loadAll(true);
  };

  /* ==========================================
     DELIVERIES
  ========================================== */

  const updateDeliveryStatus = async (
    delivery: StoreDelivery,
    status: 'pending' | 'completed' | 'failed'
  ) => {
    const order = getOrderForDelivery(delivery);

    if (status === 'completed') {
      if (!order) {
        showToast('Delivery Update Failed', 'Related order was not found.', 'error');
        return;
      }

      if (order.payment_status !== 'paid') {
        showToast('Delivery Blocked', 'Payment must be paid before delivery can be completed.', 'error');
        return;
      }
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('store_deliveries')
      .update({
        status,
        ...(status === 'completed'
          ? { delivered_at: now, error_message: null }
          : status === 'pending'
          ? { delivered_at: null }
          : {}),
      })
      .eq('id', delivery.id);

    if (error) {
      showToast('Delivery Update Failed', error.message, 'error');
      return;
    }

    const { error: orderError } = await supabase
      .from('store_orders')
      .update({
        delivery_status: status,
        ...(status === 'completed' ? { completed_at: now } : {}),
        ...(status === 'pending' ? { completed_at: null } : {}),
      })
      .eq('id', delivery.order_id);

    if (orderError) {
      showToast('Order Sync Warning', orderError.message, 'error');
      await loadAll(true);
      return;
    }

    showToast(
      'Delivery Updated',
      'Delivery and order status changed to ' + status + '.',
      'success'
    );

    await loadAll(true);
  };

  /* ==========================================
     FILTERS
  ========================================== */

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return products.filter((product) => {
      const categoryName =
        categories.find((category) => category.slug === product.category)?.name ||
        product.category;

      const matchesCategory =
        !selectedCategorySlug || product.category === selectedCategorySlug;

      const matchesSearch =
        !value ||
        product.name.toLowerCase().includes(value) ||
        product.slug.toLowerCase().includes(value) ||
        categoryName.toLowerCase().includes(value);

      return matchesCategory && matchesSearch;
    });
  }, [products, categories, search, selectedCategorySlug]);

  const filteredCategories = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(value) ||
        category.slug.toLowerCase().includes(value)
    );
  }, [categories, search]);

  const filteredPromos = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return promos;

    return promos.filter((promo) => {
      const productName =
        products.find((product) => product.id === promo.product_id)?.name || '';

      return (
        promo.code.toLowerCase().includes(value) ||
        productName.toLowerCase().includes(value)
      );
    });
  }, [promos, products, search]);

  const filteredOrders = useMemo(() => {
    const value = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesPayment =
        orderStatusFilter === 'all' ||
        order.payment_status === orderStatusFilter;

      const matchesDelivery =
        orderDeliveryFilter === 'all' ||
        order.delivery_status === orderDeliveryFilter;

      const matchesSearch =
        !value ||
        order.order_number.toLowerCase().includes(value) ||
        order.player_username.toLowerCase().includes(value) ||
        (order.product?.name || '').toLowerCase().includes(value) ||
        (order.transaction_id || '').toLowerCase().includes(value);

      return matchesPayment && matchesDelivery && matchesSearch;
    });
  }, [orders, search, orderStatusFilter, orderDeliveryFilter]);

  const filteredDeliveries = useMemo(() => {
    const value = search.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const matchesStatus =
        deliveryStatusFilter === 'all' ||
        delivery.status === deliveryStatusFilter;

      const matchesSearch =
        !value ||
        delivery.player_username.toLowerCase().includes(value) ||
        (delivery.order?.order_number || '').toLowerCase().includes(value);

      return matchesStatus && matchesSearch;
    });
  }, [deliveries, search, deliveryStatusFilter]);

  /* ==========================================
     STATS
  ========================================== */

  const totalRevenue = orders
    .filter((order) => order.payment_status === 'paid')
    .reduce((sum, order) => sum + Number(order.final_amount), 0);

  const pendingOrders = orders.filter(
    (order) => order.delivery_status === 'pending'
  ).length;

  const completedOrders = orders.filter(
    (order) => order.delivery_status === 'completed'
  ).length;

  const activePromos = promos.filter((promo) => promo.is_active).length;
  const activeCategories = categories.filter((category) => category.is_active).length;
  const awaitingPayment = orders.filter(
    (order) =>
      order.payment_status === 'pending' &&
      Number(order.final_amount) > 0
  ).length;

  const readyForDelivery = orders.filter(
    (order) =>
      order.payment_status === 'paid' &&
      order.delivery_status === 'pending'
  ).length;

  const freeOrders = orders.filter(
    (order) =>
      Number(order.final_amount) === 0 &&
      order.payment_status === 'paid'
  ).length;

  const tabs: {
    id: StoreTab;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'overview', label: 'Overview', icon: ShoppingBag },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'promos', label: 'Promo Codes', icon: Tag },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'deliveries', label: 'Deliveries', icon: Truck },
    { id: 'payment_methods', label: 'Payment Methods', icon: Coins },
  ];

  return (
    <AdminLayout active="store" permission="store">
      <style>{`
        @keyframes butterflyStoreFadeUp {
          from { opacity: 0; transform: translateY(6px) scale(.995); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes butterflyStorePulse {
          0%, 100% { opacity: .45; transform: scale(.92); }
          50% { opacity: 1; transform: scale(1); }
        }
        .butterfly-store-enter { animation: butterflyStoreFadeUp .28s ease-out both; }
        .butterfly-store-dot { animation: butterflyStorePulse 1.8s ease-in-out infinite; }
        .butterfly-store-card { transition: transform .25s ease, border-color .25s ease, background-color .25s ease, box-shadow .25s ease; }
      `}</style>

      <div className="space-y-6 butterfly-store-enter">
        {/* HEADER */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-400">
                Minecraft Store
              </p>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                realtimeState === 'connected'
                  ? 'border-green-500/15 bg-green-500/5 text-green-400'
                  : realtimeState === 'disconnected'
                  ? 'border-red-500/15 bg-red-500/5 text-red-400'
                  : 'border-yellow-500/15 bg-yellow-500/5 text-yellow-400'
              }`}>
                <span className="butterfly-store-dot h-1.5 w-1.5 rounded-full bg-current" />
                {realtimeState === 'connected' ? 'Live realtime' : realtimeState === 'disconnected' ? 'Realtime disconnected' : 'Connecting realtime'}
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              Store Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Manage products, categories, promo codes, payment verification and Minecraft deliveries from one dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 hover:-translate-y-0.5 hover:bg-white/[0.07] ${buttonClass}`}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {activeTab === 'products' && (
              <button
                onClick={openCreateProduct}
                className={`inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/20 hover:-translate-y-0.5 hover:bg-purple-500 ${buttonClass}`}
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            )}

            {activeTab === 'categories' && (
              <button
                onClick={openCreateCategory}
                className={`inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/20 hover:-translate-y-0.5 hover:bg-purple-500 ${buttonClass}`}
              >
                <Plus className="h-4 w-4" />
                Add Category
              </button>
            )}

            {activeTab === 'promos' && (
              <button
                onClick={openCreatePromo}
                className={`inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/20 hover:-translate-y-0.5 hover:bg-purple-500 ${buttonClass}`}
              >
                <Plus className="h-4 w-4" />
                Create Promo
              </button>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.id === 'categories'
                ? activeCategories
                : tab.id === 'orders'
                ? awaitingPayment
                : tab.id === 'deliveries'
                ? readyForDelivery
                : 0;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch('');
                }}
                className={`group inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-purple-500/10 text-white shadow-inner shadow-purple-500/5'
                    : 'text-slate-500 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-105" />
                {tab.label}
                {count > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-300">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SEARCH */}
        {activeTab !== 'overview' && activeTab !== 'payment_methods' && (
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative max-w-2xl flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                activeTab === 'products'
                  ? 'Search products...'
                  : activeTab === 'categories'
                  ? 'Search categories...'
                  : activeTab === 'promos'
                  ? 'Search promo codes...'
                  : activeTab === 'orders'
                  ? 'Search order, player, product or transaction...'
                  : 'Search player or order...'
              }
              className={`${inputClass} py-3 pl-10`}
            />
          </div>

          {activeTab === 'products' && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategorySlug(null)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold ${
                  selectedCategorySlug === null
                    ? 'border-purple-400/30 bg-purple-500/10 text-white'
                    : 'border-white/10 text-slate-500 hover:text-white'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategorySlug(category.slug)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
                    selectedCategorySlug === category.slug
                      ? 'border-purple-400/30 bg-purple-500/10 text-white'
                      : 'border-white/10 text-slate-500 hover:text-white'
                  }`}
                >
                  <CategoryIcon category={category} className="h-4 w-4" />
                  {category.name}
                </button>
              ))}
            </div>
          )}
          </div>
        )}

        {activeTab === 'payment_methods' ? (
          <AdminStorePaymentMethods />
        ) : loading ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              Loading Store...
            </div>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <StatCard label="Products" value={products.length} icon={<Package className="h-5 w-5" />} />
                  <StatCard label="Categories" value={`${activeCategories}/${categories.length}`} icon={<FolderTree className="h-5 w-5" />} />
                  <StatCard label="Pending Payment" value={awaitingPayment} icon={<Clock3 className="h-5 w-5" />} />
                  <StatCard label="Completed" value={completedOrders} icon={<CheckCircle2 className="h-5 w-5" />} />
                  <StatCard label="Revenue" value={formatMoney(totalRevenue)} icon={<Coins className="h-5 w-5" />} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Panel title="Order Activity" subtitle="Live store status">
                    <SummaryRow label="Total Orders" value={orders.length} />
                    <SummaryRow label="Waiting Payment" value={awaitingPayment} />
                    <SummaryRow label="Pending Delivery" value={pendingOrders} />
                    <SummaryRow label="Completed" value={completedOrders} />
                    <SummaryRow label="Failed Deliveries" value={deliveries.filter((item) => item.status === 'failed').length} />
                  </Panel>

                  <Panel title="Recent Orders" subtitle="Latest store activity">
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <button
                          key={order.id}
                          onClick={() => openOrderDetails(order)}
                          className={`flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left hover:bg-white/[0.045] ${buttonClass}`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">{order.order_number}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {order.player_username} • {order.product?.name || 'Item'}
                            </p>
                          </div>
                          <div className="ml-3 text-right">
                            <p className="text-sm font-bold text-white">{formatMoney(Number(order.final_amount))}</p>
                            <div className="mt-1"><StatusBadge status={order.payment_status} /></div>
                          </div>
                        </button>
                      ))}
                      {orders.length === 0 && <EmptyState text="No orders yet." />}
                    </div>
                  </Panel>
                </div>
              </div>
            )}

            {/* PRODUCTS */}
            {activeTab === 'products' && (
              <div className="space-y-5">
                {selectedCategorySlug && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-500/10 bg-purple-500/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                        <CategoryIcon category={getCategoryBySlug(selectedCategorySlug) || undefined} className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-purple-400">Category</p>
                        <p className="font-black text-white">{getCategoryBySlug(selectedCategorySlug)?.name || selectedCategorySlug}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCategorySlug(null)}
                      className={`rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white ${buttonClass}`}
                    >
                      Show All
                    </button>
                  </div>
                )}

                <div className="grid gap-5 xl:grid-cols-2">
                {filteredProducts.map((product) => {
                  const category = categories.find((item) => item.slug === product.category);

                  return (
                    <div
                      key={product.id}
                      className="butterfly-store-card group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:-translate-y-1 hover:border-purple-400/20 hover:bg-white/[0.045] hover:shadow-2xl hover:shadow-purple-950/20"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-500/10">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <CategoryIcon category={category} className="h-7 w-7 text-purple-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-black text-white">{product.name}</h2>
                            <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{category?.name || product.category}</span>
                            <span>•</span>
                            <span className="font-mono">{product.slug}</span>
                          </div>
                          <p className="mt-3 text-xl font-black text-white">
                            {formatMoney(Number(product.price), product.currency)}
                          </p>
                        </div>
                      </div>

                      {product.description && (
                        <p className="mt-4 text-sm leading-6 text-slate-400">{product.description}</p>
                      )}

                      {product.features?.length > 0 && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {product.features.slice(0, 6).map((feature, index) => (
                            <div key={`${product.id}-${index}`} className="flex items-start gap-2 text-xs text-slate-300">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Minecraft Commands</p>
                          <span className="text-[10px] text-slate-600">{product.minecraft_commands?.length || 0} command(s)</span>
                        </div>
                        {product.minecraft_commands?.length > 0 ? (
                          <div className="space-y-1">
                            {product.minecraft_commands.map((command, index) => (
                              <code key={index} className="block overflow-x-auto rounded-lg bg-black/30 px-3 py-2 text-xs text-purple-300">{command}</code>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">No commands configured.</span>
                        )}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                        <button
                          onClick={() => openEditProduct(product)}
                          className={`inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white ${buttonClass}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => toggleProduct(product)}
                          className={`inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white ${buttonClass}`}
                        >
                          {product.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {product.is_active ? 'Disable' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteProduct(product)}
                          className={`inline-flex items-center gap-2 rounded-lg border border-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:-translate-y-0.5 hover:bg-red-500/10 ${buttonClass}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && <div className="xl:col-span-2"><EmptyState text="No products found." /></div>}
                </div>
              </div>
            )}

            {/* CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-r from-purple-500/10 via-white/[0.02] to-transparent p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-purple-400">Store taxonomy</p>
                      <h2 className="mt-1 text-xl font-black text-white">Categories & custom icons</h2>
                      <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                        Add unlimited categories, set their order, activate/deactivate them and give each one a custom icon URL.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat label="Total" value={String(categories.length)} />
                      <MiniStat label="Active" value={String(activeCategories)} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCategories.map((category) => {
                    const usageCount = products.filter((product) => product.category === category.slug).length;

                    return (
                      <div
                        key={category.id}
                        className="butterfly-store-card group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:-translate-y-1 hover:border-purple-400/20 hover:bg-white/[0.045] hover:shadow-2xl hover:shadow-purple-950/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300 transition-transform duration-300 group-hover:scale-105">
                              <CategoryIcon category={category} className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-white">{category.name}</h3>
                              <p className="mt-1 font-mono text-[11px] text-slate-600">{category.slug}</p>
                            </div>
                          </div>
                          <StatusBadge status={category.is_active ? 'active' : 'inactive'} />
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <MiniStat label="Products" value={String(usageCount)} />
                          <MiniStat label="Sort" value={String(category.sort_order)} />
                        </div>

                        {category.icon_url && (
                          <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-3">
                            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-600">Icon URL</p>
                            <p className="truncate text-[10px] text-slate-500">{category.icon_url}</p>
                          </div>
                        )}

                        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                          <button
                            onClick={() => {
                              setSelectedCategorySlug(category.slug);
                              setActiveTab('products');
                              setSearch('');
                            }}
                            className={`inline-flex items-center gap-2 rounded-lg bg-purple-600/15 px-3 py-2 text-xs font-bold text-purple-300 hover:bg-purple-600/25 hover:text-white ${buttonClass}`}
                          >
                            <Package className="h-3.5 w-3.5" />
                            View Products
                          </button>
                          <button
                            onClick={() => openEditCategory(category)}
                            className={`inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white ${buttonClass}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => toggleCategory(category)}
                            className={`rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white ${buttonClass}`}
                          >
                            {category.is_active ? 'Disable' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteCategory(category)}
                            className={`inline-flex items-center gap-2 rounded-lg border border-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:-translate-y-0.5 hover:bg-red-500/10 ${buttonClass}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredCategories.length === 0 && (
                  <EmptyState text="No categories found. Create your first category." />
                )}
              </div>
            )}

            {/* PROMOS */}
            {activeTab === 'promos' && (
              <div className="space-y-4">
                {filteredPromos.map((promo) => {
                  const product = products.find((item) => item.id === promo.product_id);
                  return (
                    <div
                      key={promo.id}
                      className="butterfly-store-card rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/[0.15] hover:bg-white/[0.045]"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10">
                            <Tag className="h-5 w-5 text-green-400" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-mono text-lg font-black text-white">{promo.code}</h2>
                              <StatusBadge status={promo.is_active ? 'active' : 'inactive'} />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{product?.name || 'All Products'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:min-w-[520px]">
                          <MiniStat
                            label="Discount"
                            value={
                              promo.discount_type === 'free'
                                ? 'FREE'
                                : promo.discount_type === 'percentage'
                                ? `${promo.discount_value}%`
                                : formatMoney(promo.discount_value)
                            }
                          />
                          <MiniStat label="Used" value={`${promo.used_count}${promo.max_uses ? ` / ${promo.max_uses}` : ''}`} />
                          <MiniStat label="Expires" value={promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : 'Never'} />
                          <MiniStat label="Status" value={promo.is_active ? 'Active' : 'Off'} />
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
                        <button
                          onClick={() => openEditPromo(promo)}
                          className={`inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06] hover:text-white ${buttonClass}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => togglePromo(promo)}
                          className={`rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06] hover:text-white ${buttonClass}`}
                        >
                          {promo.is_active ? 'Disable' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deletePromo(promo)}
                          className={`inline-flex items-center gap-2 rounded-lg border border-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 ${buttonClass}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredPromos.length === 0 && <EmptyState text="No promo codes found." />}
              </div>
            )}

            {/* ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'pending', 'paid', 'failed', 'refunded', 'completed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderStatusFilter(status)}
                      className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize ${buttonClass} ${
                        orderStatusFilter === status
                          ? 'border-purple-400/30 bg-purple-500/10 text-white'
                          : 'border-white/10 text-slate-500 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <span className="mr-1 self-center text-[10px] font-bold uppercase tracking-wider text-slate-600">Delivery</span>
                  {['all', 'pending', 'completed', 'failed'].map((status) => (
                    <button
                      key={`delivery-${status}`}
                      onClick={() => setOrderDeliveryFilter(status)}
                      className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize ${buttonClass} ${
                        orderDeliveryFilter === status
                          ? 'border-blue-400/30 bg-blue-500/10 text-white'
                          : 'border-white/10 text-slate-500 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] text-left">
                      <thead className="border-b border-white/10 bg-white/[0.02]">
                        <tr>
                          <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">Order</th>
                          <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">Player</th>
                          <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">Product</th>
                          <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">Amount</th>
                          <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">Payment</th>
                          <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">Delivery</th>
                          <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">Payment Info</th>
                          <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">Date</th>
                          <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-600">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-white/5 hover:bg-white/[0.03]"
                          >
                            <td className="px-5 py-4">
                              <button
                                onClick={() => openOrderDetails(order)}
                                className="font-mono text-xs font-bold text-purple-300 hover:text-purple-200"
                              >
                                {order.order_number}
                              </button>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-slate-600" />
                                <span className="text-sm font-semibold text-white">{order.player_username}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-300">
                              {order.product?.name || 'Deleted Product'}
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-bold text-white">{formatMoney(Number(order.final_amount))}</span>
                              {Number(order.discount_amount) > 0 && (
                                <span className="ml-2 text-xs text-green-400">
                                  -{formatMoney(Number(order.discount_amount))}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4"><StatusBadge status={order.payment_status} /></td>
                            <td className="px-5 py-4"><StatusBadge status={order.delivery_status} /></td>
                            <td className="px-5 py-4">
                              <p className="text-xs font-semibold text-slate-300">{order.payment_method || 'Free Order'}</p>
                              <p className="mt-1 max-w-[180px] truncate font-mono text-[10px] text-slate-600">{order.transaction_id || '—'}</p>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500">{formatDate(order.created_at)}</td>
                            <td className="px-5 py-4 text-right">
                              {order.payment_status === 'pending' && (
                                <button
                                  onClick={() => verifyAndPayOrder(order)}
                                  className={`mr-2 inline-flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-400 hover:-translate-y-0.5 hover:bg-green-500/20 ${buttonClass}`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Mark Paid
                                </button>
                              )}
                              <button
                                onClick={() => openOrderDetails(order)}
                                className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.07] hover:text-white ${buttonClass}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredOrders.length === 0 && <EmptyState text="No orders found." />}
                </div>
              </div>
            )}

            {/* DELIVERIES */}
            {activeTab === 'deliveries' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'pending', 'completed', 'failed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setDeliveryStatusFilter(status)}
                      className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize ${buttonClass} ${
                        deliveryStatusFilter === status
                          ? 'border-purple-400/30 bg-purple-500/10 text-white'
                          : 'border-white/10 text-slate-500 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4">
                  {filteredDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="butterfly-store-card rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/[0.15] hover:bg-white/[0.045]"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-black text-purple-300">
                              {delivery.order?.order_number || delivery.order_id}
                            </span>
                            <StatusBadge status={delivery.status} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm">
                            <span className="text-slate-400">
                              Player: <strong className="text-white">{delivery.player_username}</strong>
                            </span>
                            <span className="text-slate-400">
                              Attempts: <strong className="text-white">{delivery.attempts}</strong>
                            </span>
                            <span className="text-slate-500">{formatDate(delivery.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(['pending', 'completed', 'failed'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => updateDeliveryStatus(delivery, status)}
                              className={`rounded-lg border px-3 py-2 text-[11px] font-bold capitalize ${buttonClass} ${
                                delivery.status === status
                                  ? 'border-purple-400/30 bg-purple-500/10 text-white'
                                  : 'border-white/10 text-slate-500 hover:text-white'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Commands</span>
                          <span className="text-[10px] text-slate-600">{delivery.commands?.length || 0} command(s)</span>
                        </div>
                        {delivery.commands?.length > 0 ? (
                          <div className="space-y-1">
                            {delivery.commands.map((command, index) => (
                              <code key={index} className="block overflow-x-auto rounded-lg bg-black/30 px-3 py-2 text-xs text-green-300">{command}</code>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">No commands.</span>
                        )}
                      </div>

                      {delivery.error_message && (
                        <div className="mt-4 rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-xs text-red-300">
                          <strong>Error:</strong> {delivery.error_message}
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => setSelectedDelivery(delivery)}
                          className="text-xs font-bold text-purple-400 hover:text-purple-300"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredDeliveries.length === 0 && <EmptyState text="No deliveries found." />}
                </div>
              </div>
            )}
          </>
        )}

        {/* PRODUCT MODAL */}
        {productEditor && (
          <Modal
            title={editingProductId ? 'Edit Product' : 'Create Product'}
            onClose={() => {
              if (!savingProduct) setProductEditor(false);
            }}
          >
            <form onSubmit={saveProduct} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product Name" required>
                  <input
                    value={productForm.name}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        name: event.target.value,
                        slug: editingProductId
                          ? current.slug
                          : makeSlug(event.target.value),
                      }))
                    }
                    placeholder="VIP Rank"
                    className={inputClass}
                  />
                </Field>
                <Field label="Slug" required>
                  <input
                    value={productForm.slug}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        slug: makeSlug(event.target.value),
                      }))
                    }
                    placeholder="vip-rank"
                    className={`${inputClass} font-mono`}
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className={textareaClass}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Category" required>
                  <select
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.filter((item) => item.is_active || item.slug === productForm.category).map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Price (BDT)" required>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Sort Order">
                  <input
                    type="number"
                    value={productForm.sort_order}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        sort_order: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Image URL">
                <input
                  value={productForm.image_url}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      image_url: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className={inputClass}
                />
              </Field>

              <Field label="Features">
                <textarea
                  value={productForm.features}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      features: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder={'VIP prefix\nSpecial chat color\nCosmetic perks'}
                  className={textareaClass}
                />
                <p className="mt-1 text-[11px] text-slate-600">One feature per line.</p>
              </Field>

              <Field label="Minecraft Commands">
                <textarea
                  value={productForm.minecraft_commands}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      minecraft_commands: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder={'lp user {player} parent set vip'}
                  className={`${textareaClass} font-mono`}
                />
                <p className="mt-1 text-[11px] text-slate-600">
                  One command per line. Use <code>{'{player}'}</code> for the Minecraft username.
                </p>
              </Field>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <input
                  type="checkbox"
                  checked={productForm.is_active}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-purple-500"
                />
                <div>
                  <p className="text-sm font-bold text-white">Product Active</p>
                  <p className="text-xs text-slate-500">Active products appear in the customer Store.</p>
                </div>
              </label>

              <ModalActions
                loading={savingProduct}
                onCancel={() => setProductEditor(false)}
                submitText={editingProductId ? 'Save Changes' : 'Create Product'}
              />
            </form>
          </Modal>
        )}

        {/* CATEGORY MODAL */}
        {categoryEditor && (
          <Modal
            title={editingCategoryId ? 'Edit Category' : 'Create Category'}
            onClose={() => {
              if (!savingCategory) setCategoryEditor(false);
            }}
          >
            <form onSubmit={saveCategory} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category Name" required>
                  <input
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        name: event.target.value,
                        slug: editingCategoryId
                          ? current.slug
                          : makeSlug(event.target.value),
                      }))
                    }
                    placeholder="Ranks"
                    className={inputClass}
                  />
                </Field>
                <Field label="Slug" required>
                  <input
                    value={categoryForm.slug}
                    readOnly={Boolean(editingCategoryId)}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        slug: makeSlug(event.target.value),
                      }))
                    }
                    placeholder="ranks"
                    className={`${inputClass} font-mono ${editingCategoryId ? 'cursor-not-allowed opacity-60' : ''}`}
                  />
                </Field>
              </div>

              <Field label="Icon URL">
                <div className="space-y-3">
                  <input
                    value={categoryForm.icon_url}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        icon_url: event.target.value,
                      }))
                    }
                    placeholder="https://example.com/category-icon.png"
                    className={inputClass}
                  />

                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                      <ImagePreview url={categoryForm.icon_url} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Custom category icon</p>
                      <p className="mt-1 text-xs text-slate-500">Paste an image URL. Broken URLs automatically fall back to the built-in icon.</p>
                    </div>
                  </div>
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sort Order">
                  <input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        sort_order: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <div className="flex items-end">
                  <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_active}
                      onChange={(event) =>
                        setCategoryForm((current) => ({
                          ...current,
                          is_active: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-purple-500"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">Category Active</p>
                      <p className="text-xs text-slate-500">Show this category in product forms.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4">
                <div className="flex items-start gap-3">
                  <FolderTree className="mt-0.5 h-4 w-4 text-purple-400" />
                  <p className="text-xs leading-5 text-slate-400">
                    Category slug stays locked after creation so existing product assignments keep working. You can still change the name, icon and sort order anytime.
                  </p>
                </div>
              </div>

              <ModalActions
                loading={savingCategory}
                onCancel={() => setCategoryEditor(false)}
                submitText={editingCategoryId ? 'Save Changes' : 'Create Category'}
              />
            </form>
          </Modal>
        )}

        {/* PROMO MODAL */}
        {promoEditor && (
          <Modal
            title={editingPromoId ? 'Edit Promo Code' : 'Create Promo Code'}
            onClose={() => {
              if (!savingPromo) setPromoEditor(false);
            }}
          >
            <form onSubmit={savePromo} className="space-y-5">
              <Field label="Promo Code" required>
                <input
                  value={promoForm.code}
                  onChange={(event) =>
                    setPromoForm((current) => ({
                      ...current,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="BUTTERFLYVIP"
                  className={`${inputClass} font-mono uppercase`}
                />
              </Field>

              <Field label="Product">
                <select
                  value={promoForm.product_id}
                  onChange={(event) =>
                    setPromoForm((current) => ({
                      ...current,
                      product_id: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">All Products</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Discount Type">
                  <select
                    value={promoForm.discount_type}
                    onChange={(event) =>
                      setPromoForm((current) => ({
                        ...current,
                        discount_type: event.target.value as PromoForm['discount_type'],
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free">Free</option>
                  </select>
                </Field>

                <Field label="Discount Value">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={promoForm.discount_type === 'free'}
                    value={promoForm.discount_value}
                    onChange={(event) =>
                      setPromoForm((current) => ({
                        ...current,
                        discount_value: event.target.value,
                      }))
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
                    value={promoForm.max_uses}
                    onChange={(event) =>
                      setPromoForm((current) => ({
                        ...current,
                        max_uses: event.target.value,
                      }))
                    }
                    placeholder="Unlimited"
                    className={inputClass}
                  />
                </Field>
                <Field label="Expiry Date">
                  <input
                    type="datetime-local"
                    value={promoForm.expires_at}
                    onChange={(event) =>
                      setPromoForm((current) => ({
                        ...current,
                        expires_at: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Percent className="mt-0.5 h-4 w-4 text-purple-400" />
                  <p className="text-xs leading-5 text-slate-400">
                    Percentage 20 means 20% off. Fixed means a BDT amount. Free makes the order 100% discounted.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <input
                  type="checkbox"
                  checked={promoForm.is_active}
                  onChange={(event) =>
                    setPromoForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-purple-500"
                />
                <div>
                  <p className="text-sm font-bold text-white">Promo Active</p>
                  <p className="text-xs text-slate-500">Customers can use this code.</p>
                </div>
              </label>

              <ModalActions
                loading={savingPromo}
                onCancel={() => setPromoEditor(false)}
                submitText={editingPromoId ? 'Save Changes' : 'Create Promo'}
              />
            </form>
          </Modal>
        )}

        {/* ORDER DETAIL MODAL */}
        {selectedOrder && (
          <Modal
            title="Order Details"
            onClose={() => setSelectedOrder(null)}
          >
            <div className="space-y-5">
              <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">Order Number</p>
                    <p className="mt-1 font-mono text-xl font-black text-white">{selectedOrder.order_number}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={selectedOrder.payment_status} />
                    <StatusBadge status={selectedOrder.delivery_status} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <User className="h-4 w-4 text-purple-400" />
                  Customer
                </h3>
                <div className="space-y-2">
                  <DetailRow label="Minecraft Username" value={selectedOrder.player_username} />
                  <DetailRow label="Product" value={selectedOrder.product?.name || 'Deleted Product'} />
                  <DetailRow label="Created" value={formatDate(selectedOrder.created_at)} />
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <Coins className="h-4 w-4 text-purple-400" />
                  Payment Information
                </h3>
                <div className="space-y-2">
                  <DetailRow label="Payment Method" value={selectedOrder.payment_method || 'Free Order'} />
                  <DetailRow label="Transaction ID" value={selectedOrder.transaction_id || '—'} mono />
                  <DetailRow label="Original Amount" value={formatMoney(Number(selectedOrder.original_amount))} />
                  <DetailRow label="Discount" value={`-${formatMoney(Number(selectedOrder.discount_amount))}`} />
                  <div className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                    <span className="text-sm font-bold text-slate-300">Final Amount</span>
                    <span className="text-xl font-black text-white">{formatMoney(Number(selectedOrder.final_amount))}</span>
                  </div>
                </div>

                {Number(selectedOrder.final_amount) > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setPaymentEditorOpen((current) => !current);
                        setPaymentMethodDraft(selectedOrder.payment_method || '');
                        setTransactionIdDraft(selectedOrder.transaction_id || '');
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white ${buttonClass}`}
                    >
                      <Pencil className="h-4 w-4" />
                      {paymentEditorOpen ? 'Close Payment Editor' : 'Edit Payment Details'}
                    </button>
                  </div>
                )}

                {paymentEditorOpen && Number(selectedOrder.final_amount) > 0 && (
                  <div className="mt-4 rounded-2xl border border-purple-500/15 bg-purple-500/5 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Payment Method" required>
                        <input
                          value={paymentMethodDraft}
                          onChange={(event) => setPaymentMethodDraft(event.target.value)}
                          placeholder="bKash / Nagad / Bank"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Transaction ID" required>
                        <input
                          value={transactionIdDraft}
                          onChange={(event) => setTransactionIdDraft(event.target.value)}
                          placeholder="Transaction reference"
                          className={`${inputClass} font-mono`}
                        />
                      </Field>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={savePaymentDetails}
                        disabled={savingPaymentDetails}
                        className={`inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50 ${buttonClass}`}
                      >
                        {savingPaymentDetails && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Payment Details
                      </button>
                      <button
                        onClick={() => setPaymentEditorOpen(false)}
                        className={`rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white ${buttonClass}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <Truck className="h-4 w-4 text-purple-400" />
                  Delivery Information
                </h3>
                <div className="space-y-2">
                  <DetailRow label="Delivery Status" value={selectedOrder.delivery_status} />
                  <DetailRow label="Completed At" value={formatDate(selectedOrder.completed_at)} />
                </div>
              </div>

              {Number(selectedOrder.final_amount) > 0 && selectedOrder.payment_status === 'pending' && (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
                    <div>
                      <h3 className="font-bold text-white">Payment Verification Required</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Delivery remains pending until the admin verifies this payment.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => verifyAndPayOrder(selectedOrder)}
                      className={`inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-green-500 ${buttonClass}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Paid
                    </button>
                    <button
                      onClick={() => failOrderPayment(selectedOrder)}
                      className={`inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/20 ${buttonClass}`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      Payment Failed
                    </button>
                  </div>
                </div>
              )}

              {Number(selectedOrder.final_amount) === 0 && selectedOrder.payment_status === 'paid' && (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <div>
                      <h3 className="font-bold text-white">Free Order</h3>
                      <p className="mt-1 text-sm text-slate-400">100% discounted orders are already marked paid and only wait for delivery.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.payment_status === 'paid' && selectedOrder.delivery_status === 'pending' && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-blue-400" />
                    <div>
                      <h3 className="font-bold text-white">Ready for Automatic Delivery</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Payment is paid and delivery is pending. The Minecraft server can now pick it up automatically.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.payment_status === 'paid' && Number(selectedOrder.final_amount) > 0 && (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <div>
                      <h3 className="font-bold text-white">Payment Verified</h3>
                      <p className="mt-1 text-sm text-slate-400">Payment has been verified by the admin.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => refundOrder(selectedOrder)}
                      className={`rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/20 ${buttonClass}`}
                    >
                      Mark Refunded
                    </button>
                  </div>
                </div>
              )}

              {selectedOrder.payment_status === 'failed' && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div>
                      <h3 className="font-bold text-white">Payment Failed</h3>
                      <p className="mt-1 text-sm text-slate-400">This payment was marked as failed.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => updateOrderStatus(selectedOrder, 'pending')}
                      className={`rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 ${buttonClass}`}
                    >
                      Reopen Payment
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end border-t border-white/10 pt-5">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white ${buttonClass}`}
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* DELIVERY DETAIL MODAL */}
        {selectedDelivery && (
          <Modal
            title="Delivery Details"
            onClose={() => setSelectedDelivery(null)}
          >
            <div className="space-y-4">
              <DetailRow label="Order" value={selectedDelivery.order?.order_number || selectedDelivery.order_id} mono />
              <DetailRow label="Player" value={selectedDelivery.player_username} />
              <DetailRow label="Status" value={selectedDelivery.status} />
              <DetailRow label="Attempts" value={String(selectedDelivery.attempts)} />
              <DetailRow label="Created" value={formatDate(selectedDelivery.created_at)} />
              <DetailRow label="Delivered" value={formatDate(selectedDelivery.delivered_at)} />

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">Minecraft Commands</p>
                <div className="space-y-2">
                  {selectedDelivery.commands?.map((command, index) => (
                    <code key={index} className="block overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-green-300">
                      {command}
                    </code>
                  ))}
                </div>
              </div>

              {selectedDelivery.error_message && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  <strong>Error:</strong> {selectedDelivery.error_message}
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

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
        {required && <span className="ml-1 text-red-400">*</span>}
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
    <div className="butterfly-store-card rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:-translate-y-0.5 hover:border-purple-400/15 hover:bg-white/[0.045] hover:shadow-xl hover:shadow-black/20">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</span>
        <span className="rounded-lg bg-purple-500/10 p-2 text-purple-400">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-white">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 space-y-2">{children}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
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
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
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
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className={`max-w-[65%] break-all text-right text-sm font-semibold text-white ${
          mono ? 'font-mono text-purple-300' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
      <Package className="mx-auto h-9 w-9 text-slate-700" />
      <p className="mt-3 text-sm text-slate-500">{text}</p>
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
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b12] shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-72px)] overflow-y-auto p-6">{children}</div>
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
        className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-40"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-purple-500 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitText}
      </button>
    </div>
  );
}
