import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Flame,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Heart,
  ArrowUpRight,
  Gauge,
  X,
  Check,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  History,
  Package
} from 'lucide-react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import './marketplace.css';

const initialProducts = [
  {
    id: 1,
    name: 'Forged Alloy Wheels',
    category: 'Exterior',
    price: 24999,
    oldPrice: 29999,
    rating: '4.9',
    tag: 'BESTSELLER',
    stock: 10,
    image: '/ForgedAlloyWheels.jpg'
  },
  {
    id: 2,
    name: 'Performance LED Headlights',
    category: 'Lighting',
    price: 5499,
    oldPrice: 6999,
    rating: '4.8',
    tag: 'SALE',
    stock: 15,
    image: '/PerformanceLEDHeadlights.jpg'
  },
  {
    id: 3,
    name: 'Carbon Fiber Rear Spoiler',
    category: 'Exterior',
    price: 8999,
    oldPrice: null,
    rating: '4.7',
    tag: 'TRENDING',
    stock: 8,
    image: '/Carbonfiberrearspoiler.jpg'
  },
  {
    id: 4,
    name: 'Sport Steering Wheel',
    category: 'Interior',
    price: 7499,
    oldPrice: 8999,
    rating: '4.8',
    tag: '',
    stock: 12,
    image: '/SportSteeringWheel.jpg'
  },
  {
    id: 5,
    name: 'Stainless Steel Exhaust Tip',
    category: 'Performance',
    price: 3299,
    oldPrice: null,
    rating: '4.6',
    tag: '',
    stock: 20,
    image: '/StainlessSteelExhaustTip.jpg'
  },
  {
    id: 6,
    name: 'Premium Car Care Kit',
    category: 'Car Care',
    price: 1499,
    oldPrice: 1999,
    rating: '4.9',
    tag: 'SALE',
    stock: 25,
    image: '/PremiumCarCareKit.jpg'
  },
  {
    id: 7,
    name: 'Performance Air Filter',
    category: 'Performance',
    price: 2199,
    oldPrice: null,
    rating: '4.5',
    tag: '',
    stock: 14,
    image: '/PerformanceAirFilter.jpg'
  },
  {
    id: 8,
    name: 'Premium Seat Covers',
    category: 'Interior',
    price: 3999,
    oldPrice: 4999,
    rating: '4.7',
    tag: 'POPULAR',
    stock: 7,
    image: '/PremiumSeatCovers.jpg'
  },
  {
    id: 9,
    name: 'Sequential LED Tail Lights',
    category: 'Lighting',
    price: 6299,
    oldPrice: null,
    rating: '4.8',
    tag: 'NEW',
    stock: 9,
    image: '/SequentialLEDTaillights.jpg'
  },
  {
    id: 10,
    name: 'Sport Pedal Set',
    category: 'Interior',
    price: 1299,
    oldPrice: null,
    rating: '4.4',
    tag: '',
    stock: 18,
    image: '/SportPedalSet.jpg'
  },
  {
    id: 11,
    name: 'Performance Brake Discs',
    category: 'Performance',
    price: 5999,
    oldPrice: 7499,
    rating: '4.8',
    tag: 'SALE',
    stock: 6,
    image: '/PerformanceBrakeDiscs.jpg'
  },
  {
    id: 12,
    name: 'Universal Phone Mount',
    category: 'Car Care',
    price: 799,
    oldPrice: null,
    rating: '4.5',
    tag: 'BUDGET PICK',
    stock: 30,
    image: '/UniversalPhoneMount.jpg'
  }
];

const categories = [
  'All Parts',
  'Exterior',
  'Interior',
  'Performance',
  'Lighting',
  'Car Care'
];

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

const formatDate = (date) =>
  date
    ? date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Just now';

export default function Marketplace() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Parts');
  const [sortBy, setSortBy] = useState('featured');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notice, setNotice] = useState('');
  const [view, setView] = useState('shop');

  // Order history state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Track the logged-in user. Orders are tied strictly to this account's uid.
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const lastUidRef = useRef(auth.currentUser?.uid || null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const newUid = user?.uid || null;
      // When the account changes (login, logout, switch user), wipe everything
      // that belonged to the previous account so nothing leaks across users.
      if (lastUidRef.current !== newUid) {
        lastUidRef.current = newUid;
        setOrders([]);
        setOrdersError('');
        setCart([]);
        setProducts(initialProducts);
        setView('shop');
      }
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // Razorpay Test Key Configuration
  const RAZORPAY_KEY_ID = 'rzp_test_Ts0JlToDTfcBA5';

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const loadOrders = async () => {
    const user = auth.currentUser;
    if (!user) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    setOrdersError('');
    try {
      // Only fetch orders that belong to the logged-in account
      const q = query(collection(db, 'orders'), where('customerId', '==', user.uid));
      const snap = await getDocs(q);
      // If the user logged out / switched while loading, discard the result
      if (auth.currentUser?.uid !== user.uid) return;
      const list = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAtDate: data.createdAt?.toDate ? data.createdAt.toDate() : null
          };
        })
        .sort((a, b) => (b.createdAtDate?.getTime() || 0) - (a.createdAtDate?.getTime() || 0));
      setOrders(list);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setOrdersError('Could not load your orders. Check your Firestore rules and connection.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'orders' && currentUser) loadOrders();
  }, [view, currentUser]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === 'All Parts' || product.category === category;

      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'high') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, search, category, sortBy]);

  // Decrease stock immediately when adding to cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      setNotice(`${product.name} is out of stock!`);
      return;
    }

    // Decrease available stock globally
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === product.id ? { ...p, stock: p.stock - 1 } : p))
    );

    setCart((currentCart) => {
      const existingIndex = currentCart.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...currentCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      } else {
        return [...currentCart, { ...product, quantity: 1 }];
      }
    });
    setNotice(`${product.name} added to your cart`);
  };

  // Handle quantity changes inside the cart (syncs with available stock)
  const updateQuantity = (id, delta) => {
    const product = products.find((p) => p.id === id);

    if (delta > 0 && product && product.stock <= 0) {
      setNotice(`No more stock available for ${product.name}`);
      return;
    }

    // Adjust global stock pool when incrementing/decrementing in cart
    if (delta > 0) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: p.stock - 1 } : p))
      );
    } else if (delta < 0) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: p.stock + 1 } : p))
      );
    }

    setCart((currentCart) => {
      return currentCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Remove item completely from cart and return all its quantity back to stock
  const removeFromCart = (id) => {
    const cartItem = cart.find((item) => item.id === id);
    if (cartItem) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: p.stock + cartItem.quantity } : p))
      );
    }
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  const getProductQuantityInCart = (id) => {
    const item = cart.find((i) => i.id === id);
    return item ? item.quantity : 0;
  };

  const toggleWishlist = (id) => {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    );
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartBill = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const saveOrder = async (paymentId, items, total, uid) => {
    try {
      await addDoc(collection(db, 'orders'), {
        customerId: uid, // Ties order strictly to the logged-in account
        paymentId,
        total,
        status: 'Paid',
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          price: i.price,
          quantity: i.quantity,
          image: i.image
        })),
        createdAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error('Failed to save order:', err);
      return false;
    }
  };

  const handleRazorpayCheckout = () => {
    if (totalCartBill === 0) return;

    const user = auth.currentUser;
    if (!user) {
      setNotice('Please log in to place an order.');
      return;
    }

    if (!window.Razorpay) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    const orderItems = [...cart];
    const orderTotal = totalCartBill;

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: orderTotal * 100,
      currency: 'INR',
      name: 'Parts Syndicate Market',
      description: 'College Project Sandbox Checkout',
      image: '/ForgedAlloyWheels.jpg',
      handler: async function (response) {
        const saved = await saveOrder(response.razorpay_payment_id, orderItems, orderTotal, user.uid);
        alert(
          `Payment Successful! Transaction ID: ${response.razorpay_payment_id}` +
            (saved ? '' : '\n(Warning: order could not be saved to history.)')
        );
        setCart([]);
        setView(saved ? 'orders' : 'shop');
      },
      prefill: {
        name: auth.currentUser?.email || 'College Student',
        email: auth.currentUser?.email || 'student@project.edu',
        contact: '9999999999'
      },
      theme: {
        color: '#f59e0b'
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  return (
    <div 
      className="marketplace-page text-white overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundImage: `linear-gradient(to bottom, rgba(7, 9, 13, 0.88), rgba(7, 9, 13, 0.96)), url('/market-place.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Navigation */}
      <header className="market-header px-6 md:px-12 py-4 flex items-center justify-end bg-[#07090d]/60 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
        <button
          className="market-cart-button flex items-center space-x-2 cursor-pointer bg-[#0c1017]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"
          onClick={() => setView(view === 'orders' ? 'shop' : 'orders')}
          aria-label="Order history"
          style={{ marginRight: 12 }}
        >
          <History size={19} />
          <span>{view === 'orders' ? 'Back to Shop' : 'My Orders'}</span>
        </button>
        <button
          className="market-cart-button flex items-center space-x-2 cursor-pointer bg-[#0c1017]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"
          onClick={() => setView(view === 'cart' ? 'shop' : 'cart')}
          aria-label="View cart"
        >
          <ShoppingCart size={19} />
          <span>{view === 'cart' ? 'Continue Shopping' : 'Cart'}</span>
          <span className="cart-count bg-amber-500 text-black px-2 py-0.5 rounded-full text-xs font-bold">{totalCartItems}</span>
        </button>
      </header>

      {view === 'orders' ? (
        /* USER-SPECIFIC ORDER HISTORY VIEW (NO WISHLIST/FAVORITES) */
        <main className="market-main max-w-4xl mx-auto py-8 px-4">
          <button
            onClick={() => setView('shop')}
            className="inline-flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white mb-6 cursor-pointer bg-[#0c1017] px-4 py-2 rounded-xl border border-white/10"
          >
            <ArrowLeft size={16} />
            <span>Back to Parts Grid</span>
          </button>

          <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
            Your Order History ({orders.length})
          </h2>

          {!currentUser ? (
            <div className="p-12 rounded-2xl bg-[#0c1017] border border-white/10 text-center space-y-4">
              <Package size={40} className="mx-auto text-gray-600" />
              <p className="text-sm text-gray-400">Please log in to see your order history.</p>
              <button
                onClick={() => setView('shop')}
                className="px-6 py-3 bg-amber-500 text-black text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer"
              >
                Back to Shop
              </button>
            </div>
          ) : ordersLoading ? (
            <div className="p-12 rounded-2xl bg-[#0c1017] border border-white/10 text-center text-sm text-gray-400">
              Loading your orders...
            </div>
          ) : ordersError ? (
            <div className="p-8 rounded-2xl bg-[#0c1017] border border-red-500/30 text-center space-y-4">
              <p className="text-sm text-red-400">{ordersError}</p>
              <button
                onClick={loadOrders}
                className="px-6 py-3 bg-amber-500 text-black text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0c1017] border border-white/10 text-center space-y-4">
              <Package size={40} className="mx-auto text-gray-600" />
              <p className="text-sm text-gray-400">You haven't bought anything yet.</p>
              <button
                onClick={() => setView('shop')}
                className="px-6 py-3 bg-amber-500 text-black text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer"
              >
                Browse Parts
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#0c1017] border border-white/10 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-wider text-amber-500">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-gray-400">{formatDate(order.createdAtDate)}</p>
                      {order.paymentId && (
                        <p className="text-[11px] text-gray-500">Payment ID: {order.paymentId}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                      {order.status || 'Paid'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-xl border border-white/10"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-white">{item.name}</h4>
                            <span className="text-[11px] text-gray-400">
                              {formatPrice(item.price)} × {item.quantity}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-white">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-sm font-black text-white border-t border-white/10 pt-3">
                    <span>Total Paid</span>
                    <span className="text-amber-400">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      ) : view === 'cart' ? (
        /* CART & BILLING VIEW */
        <main className="market-main max-w-4xl mx-auto py-8 px-4">
          <button
            onClick={() => setView('shop')}
            className="inline-flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white mb-6 cursor-pointer bg-[#0c1017] px-4 py-2 rounded-xl border border-white/10"
          >
            <ArrowLeft size={16} />
            <span>Back to Parts Grid</span>
          </button>

          <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
            Your Syndicate Cart ({totalCartItems} Items)
          </h2>

          {cart.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0c1017] border border-white/10 text-center space-y-4">
              <ShoppingCart size={40} className="mx-auto text-gray-600" />
              <p className="text-sm text-gray-400">Your cart is currently empty.</p>
              <button
                onClick={() => setView('shop')}
                className="px-6 py-3 bg-amber-500 text-black text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer"
              >
                Browse Parts
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-[#0c1017] border border-white/10"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl border border-white/10"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-white">{item.name}</h4>
                        <span className="text-xs text-amber-500 font-semibold">{formatPrice(item.price)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 bg-[#07090d] px-3 py-1.5 rounded-xl border border-white/10">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-gray-400 hover:text-white cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="text-gray-400 hover:text-white cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-white w-20 text-right">
                        {formatPrice(item.price * item.quantity)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 p-2 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Summary Card */}
              <div className="bg-[#0c1017] border border-amber-500/30 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-500">Order Summary</h3>
                <div className="space-y-2 text-xs text-gray-400 border-b border-white/10 pb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalCartBill)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Syndicate Shipping</span>
                    <span className="text-emerald-400 font-semibold">FREE</span>
                  </div>
                </div>
                <div className="flex justify-between text-base font-black text-white">
                  <span>Total Bill</span>
                  <span className="text-amber-400">{formatPrice(totalCartBill)}</span>
                </div>
                <button
                  onClick={handleRazorpayCheckout}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-red-600 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Pay with Razorpay Sandbox ({formatPrice(totalCartBill)})
                </button>
              </div>
            </div>
          )}
        </main>
      ) : (
        /* SHOPPING GRID VIEW */
        <>
          {/* Marketplace Content */}
          <main className="market-main max-w-7xl mx-auto py-10 px-6" id="products">
            <div className="market-section-heading mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="section-kicker text-amber-400 font-bold text-xs uppercase tracking-widest">THE AFTERMARKET</span>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white mt-1">
                  THE <span>PARTS GRID.</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">Curated upgrades. Uncompromising style.</p>
              </div>

              <div className="inventory-count bg-[#0c1017]/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-center">
                <span className="block text-lg font-black text-amber-400">{filteredProducts.length.toString().padStart(2, '0')}</span>
                <small className="text-[10px] text-gray-400 uppercase tracking-widest">ITEMS FOUND</small>
              </div>
            </div>

            {/* Search and Sorting */}
            <div className="market-toolbar flex flex-col sm:flex-row gap-4 mb-6">
              <div className="market-search flex-1 relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search parts, accessories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search products"
                  className="w-full pl-10 pr-10 py-3 bg-[#0c1017]/80 backdrop-blur-md border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
                {search && (
                  <button
                    className="clear-search absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="market-sort flex items-center space-x-2 bg-[#0c1017]/80 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
                <SlidersHorizontal size={17} className="text-amber-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort products"
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-[#0c1017]">Featured</option>
                  <option value="low" className="bg-[#0c1017]">Price: Low to High</option>
                  <option value="high" className="bg-[#0c1017]">Price: High to Low</option>
                  <option value="name" className="bg-[#0c1017]">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Category Filters */}
            <div className="market-categories flex flex-wrap gap-2 mb-8">
              {categories.map((item) => (
                <button
                  key={item}
                  className={`category-chip px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                    category === item 
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                      : 'bg-[#0c1017]/80 backdrop-blur-md text-gray-300 border border-white/10 hover:border-amber-500/50'
                  }`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="product-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredProducts.map((product) => {
                const qtyInCart = getProductQuantityInCart(product.id);
                const isOutOfStock = product.stock <= 0;
                return (
                  <article className="product-card bg-[#0c1017]/90 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col" key={product.id}>
                    <div className="product-image-wrap relative h-48 overflow-hidden bg-black/40">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="product-image w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="product-image-overlay absolute inset-0 bg-gradient-to-t from-[#0c1017] via-transparent to-transparent" />
                      {product.tag && (
                        <span className={`product-tag absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${product.tag === 'SALE' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'}`}>
                          {product.tag}
                        </span>
                      )}
                      <button
                        className={`wishlist-button absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md transition-colors cursor-pointer ${
                          wishlist.includes(product.id) ? 'text-red-500' : 'text-gray-300 hover:text-white'
                        }`}
                        onClick={() => toggleWishlist(product.id)}
                        aria-label="Wishlist"
                      >
                        <Heart
                          size={17}
                          fill={wishlist.includes(product.id) ? 'currentColor' : 'none'}
                        />
                      </button>
                      <span className="product-number absolute bottom-3 left-3 text-[10px] font-bold tracking-widest text-gray-400 bg-black/50 px-2 py-0.5 rounded-md">
                        PC-{String(product.id).padStart(3, '0')}
                      </span>
                    </div>

                    <div className="product-info p-5 flex flex-col flex-grow justify-between space-y-4">
                      <div>
                        <div className="product-meta flex items-center justify-between mb-2">
                          <span className="product-category text-[11px] font-bold text-amber-500 uppercase">{product.category}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isOutOfStock ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                            {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-white line-clamp-1">{product.name}</h3>
                      </div>

                      <div className="product-bottom flex flex-col items-start gap-2 pt-3 border-t border-white/10">
                        <div className="w-full flex items-center justify-between">
                          <div className="product-pricing">
                            <span className="product-price text-sm font-black text-white">{formatPrice(product.price)}</span>
                            {product.oldPrice && (
                              <span className="product-old-price text-xs text-gray-500 line-through ml-2">{formatPrice(product.oldPrice)}</span>
                            )}
                          </div>

                          {qtyInCart > 0 ? (
                            /* Quantity stepper shown once the item is in the cart */
                            <div className="flex items-center space-x-2 bg-[#07090d] px-2 py-1.5 rounded-xl border border-amber-500/40">
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                className="text-gray-300 hover:text-white p-1 cursor-pointer"
                                aria-label={`Decrease ${product.name} quantity`}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-xs font-bold w-5 text-center text-white">{qtyInCart}</span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                disabled={isOutOfStock}
                                className={`text-amber-400 hover:text-amber-300 p-1 cursor-pointer ${
                                  isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''
                                }`}
                                aria-label={`Increase ${product.name} quantity`}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              className={`add-cart-button p-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-colors cursor-pointer ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => addToCart(product)}
                              disabled={isOutOfStock}
                              aria-label={`Add ${product.name} to cart`}
                            >
                              <ShoppingCart size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="market-empty text-center py-16 bg-[#0c1017]/90 backdrop-blur-md rounded-2xl border border-white/10 space-y-4">
                <Search size={35} className="mx-auto text-gray-600" />
                <h3 className="text-base font-bold text-white">No parts found.</h3>
                <p className="text-xs text-gray-400">Try a different search or category.</p>
                <button
                  className="reset-filters px-6 py-2.5 bg-amber-500 text-black text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer"
                  onClick={() => {
                    setSearch('');
                    setCategory('All Parts');
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </main>
        </>
      )}

      {/* Cart Feedback Toast */}
      {notice && (
        <div className="market-toast" role="status">
          <Check size={17} />
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}