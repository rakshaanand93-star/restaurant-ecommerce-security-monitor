import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { 
  LogOut, User as UserIcon, ShoppingCart, Heart, MapPin, 
  Package, Menu as MenuIcon, ChevronRight, X, Clock, Star, 
  Search, Plus, Minus, CheckCircle, CreditCard
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function CustomerDashboard() {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeCompany = localStorage.getItem('company')?.toLowerCase() || 'amazon';
  const isAmazon = activeCompany === 'amazon';

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [cart, setCart] = useState<any>({ items: [] });
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // Zomato Menu State
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [restaurantMenus, setRestaurantMenus] = useState<any[]>([]);

  // Amazon Warehouse State
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

  // Fetch initial data
  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const token = await currentUser.getIdToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Cart
        if (isAmazon) {
          const cartRes = await fetch(`${backendUrl}/api/customer/cart/${activeCompany}?customerId=${currentUser.uid}`, { headers });
          if (cartRes.ok) setCart(await cartRes.json());
        } else {
          const cartRes = await fetch(`${backendUrl}/api/cart`, { headers });
          if (cartRes.ok) {
            const data = await cartRes.json();
            setCart({ items: data });
          }
        }

        // Fetch Orders
        const orderRes = await fetch(`${backendUrl}/api/orders?customerId=${currentUser.uid}&company=${activeCompany}`, { headers });
        if (orderRes.ok) setOrders(await orderRes.json());

        // Fetch Shop Data
        if (isAmazon) {
          const whRes = await fetch(`${backendUrl}/api/shop/warehouses`, { headers });
          if (whRes.ok) setWarehouses(await whRes.json());
        } else {
          const restRes = await fetch(`${backendUrl}/api/shop/restaurants`, { headers });
          if (restRes.ok) setRestaurants(await restRes.json());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, activeCompany, isAmazon]);

  // Firestore Realtime Listener for Active Order (the most recent one)
  useEffect(() => {
    if (orders.length > 0) {
      const activeOrder = orders[0];
      if (activeOrder.status !== 'delivered' && activeOrder.status !== 'completed' && activeOrder.status !== 'cancelled') {
        const unsubscribe = onSnapshot(doc(db, 'orders', activeOrder.orderId), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setOrders(prev => prev.map(o => o.orderId === data.orderId ? { ...o, status: data.status } : o));
          }
        });
        return () => unsubscribe();
      }
    }
  }, [orders.length]);

  const handleLogout = async () => {
    await logout();
  };

  const addToCart = async (item: any) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = await currentUser?.getIdToken();
      
      if (isAmazon) {
        const res = await fetch(`${backendUrl}/api/customer/cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            customerId: currentUser?.uid,
            company: activeCompany,
            item: {
              productId: item._id,
              name: item.name,
              price: item.price || 0,
              quantity: 1,
              image: item.image || item.imageUrl
            }
          })
        });
        if (res.ok) setCart(await res.json());
      } else {
        const res = await fetch(`${backendUrl}/api/cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            restaurantId: item.restaurantId,
            menuItemId: item._id,
            restaurantName: item.restaurantName || item.restaurantId, 
            menuName: item.name,
            price: item.price || 0,
            quantity: 1,
            image: item.image || item.imageUrl
          })
        });
        if (res.ok) {
          // Re-fetch cart
          const cartRes = await fetch(`${backendUrl}/api/cart`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (cartRes.ok) setCart({ items: await cartRes.json() });
        }
      }
    } catch(err) {}
  };

  const handleViewMenu = async (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = await currentUser?.getIdToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${backendUrl}/api/shop/menus/${restaurant.restaurantId}`, { headers });
      if (res.ok) {
        setRestaurantMenus(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setActiveTab('menu');
    }
  };

  const handleViewWarehouse = async (warehouse: any) => {
    setSelectedWarehouse(warehouse);
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = await currentUser?.getIdToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${backendUrl}/api/shop/products/${warehouse.name}`, { headers });
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setActiveTab('warehouse');
    }
  };

  const updateCartQty = async (itemId: string, qty: number, isProduct: boolean) => {
     try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = await currentUser?.getIdToken();
      if (isAmazon) {
        const res = await fetch(`${backendUrl}/api/customer/cart/item`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            customerId: currentUser?.uid,
            company: activeCompany,
            itemId,
            quantity: qty,
            isProduct
          })
        });
        if (res.ok) setCart(await res.json());
      } else {
        const res = await fetch(`${backendUrl}/api/cart/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ quantity: qty })
        });
        if (res.ok) {
          const cartRes = await fetch(`${backendUrl}/api/cart`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (cartRes.ok) setCart({ items: await cartRes.json() });
        }
      }
    } catch(err) {}
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = await currentUser?.getIdToken();
      if (!isAmazon) {
        const res = await fetch(`${backendUrl}/api/cart/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          alert('Item removed from cart.');
          const cartRes = await fetch(`${backendUrl}/api/cart`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (cartRes.ok) setCart({ items: await cartRes.json() });
        }
      } else {
        await updateCartQty(itemId, 0, true);
        alert('Item removed from cart.');
      }
    } catch(err) {}
  };

  const getCartItem = (item: any, isAmazonItem: boolean) => {
    if (isAmazonItem) {
      return cart.items.find((c: any) => c.productId === item._id);
    }
    return cart.items.find((c: any) => c.menuItemId === item._id);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = await currentUser?.getIdToken();
      if (isAmazon) {
        const res = await fetch(`${backendUrl}/api/customer/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            customerId: currentUser?.uid,
            company: activeCompany,
            email: currentUser?.email,
            paymentMethod: 'COD',
            shippingAddress: { street: '123 Main St' }
          })
        });
        if (res.ok) {
          const newOrder = await res.json();
          setOrders(prev => [newOrder, ...prev]);
          setCart({ items: [] });
          setActiveTab('history');
        }
      } else {
        const res = await fetch(`${backendUrl}/api/cart/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            email: currentUser?.email
          })
        });
        if (res.ok) {
          const newOrder = await res.json();
          setOrders(prev => [newOrder, ...prev]);
          setCart({ items: [] });
          setActiveTab('history');
        }
      }
    } catch(err) {}
  };

  const navItems = isAmazon ? [
    { id: 'home', label: 'Home', icon: MenuIcon },
    { id: 'shop', label: 'Products', icon: Package },
    { id: 'cart', label: 'Cart', icon: ShoppingCart },
    { id: 'history', label: 'My Orders', icon: Clock },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ] : [
    { id: 'home', label: 'Home', icon: MenuIcon },
    { id: 'shop', label: 'Restaurants', icon: MapPin },
    { id: 'cart', label: 'Cart', icon: ShoppingCart },
    { id: 'history', label: 'My Orders', icon: Clock },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const brandColor = isAmazon ? 'bg-[#232F3E] text-white' : 'bg-[#E23744] text-white';
  const accentColor = isAmazon ? 'text-[#FF9900]' : 'text-[#E23744]';
  const activeBg = isAmazon ? 'bg-[#FF9900]/10 border-l-4 border-[#FF9900]' : 'bg-[#E23744]/10 border-l-4 border-[#E23744]';

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      
      {/* SIDEBAR */}
      <aside className={`w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen shrink-0 z-20 shadow-sm`}>
        <div className={`p-6 ${brandColor} font-bold text-2xl flex items-center justify-between`}>
          {isAmazon ? <span>amazon<span className="text-[#FF9900]">.in</span></span> : <span>zomato</span>}
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === item.id ? `${activeBg} ${accentColor}` : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? accentColor : 'text-gray-400'}`} />
              {item.label}
              {item.id === 'cart' && cart.items.length > 0 && (
                <span className={`ml-auto ${brandColor} text-[10px] px-2 py-0.5 rounded-full`}>{cart.items.length}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAV */}
        <header className={`${brandColor} h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow`}>
          <div className="flex items-center">
            <button className="md:hidden mr-4" onClick={() => setMobileMenuOpen(true)}>
              <MenuIcon size={24} />
            </button>
            <h1 className="text-xl font-bold md:hidden">
               {isAmazon ? 'amazon.in' : 'zomato'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/20 transition">
               <UserIcon size={16} />
               <span className="text-sm font-medium">{currentUser?.email?.split('@')[0]}</span>
             </div>
             <button onClick={handleLogout} className="hover:text-gray-300 transition-colors" title="Logout">
               <LogOut size={18} />
             </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
           {loading ? (
             <div className="animate-pulse space-y-4">
               <div className="h-32 bg-gray-200 rounded-xl"></div>
               <div className="h-64 bg-gray-200 rounded-xl"></div>
             </div>
           ) : (
             <>
                {/* HOME TAB */}
                {activeTab === 'home' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">Welcome back, {currentUser?.email?.split('@')[0]}!</h2>
                      <p className="text-gray-500 mt-2">Find your favorite {isAmazon ? 'products' : 'food'} today.</p>
                    </div>

                    {orders.length > 0 && (
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="text-lg font-bold">Latest Order</h3>
                           <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                             orders[0].status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                           }`}>
                             {orders[0].status.toUpperCase()}
                           </span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Order ID: {orders[0].orderId}</p>
                        <p className="text-sm text-gray-600 mt-1">Total: ₹{orders[0].amount}</p>
                        <button onClick={() => setActiveTab('history')} className={`mt-4 text-sm font-bold ${accentColor} hover:underline`}>
                          Track Order
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* SHOP TAB (PRODUCTS / RESTAURANTS) */}
                {activeTab === 'shop' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-800">{isAmazon ? 'All Products' : 'All Restaurants'}</h2>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="Search..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {(isAmazon ? warehouses : restaurants).filter((i: any) => i.name.toLowerCase().includes(search.toLowerCase())).map((item: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                           <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden rounded-t-lg relative">
                             {(() => {
                               let imgSrc = item.image || item.imageUrl;
                               if (isAmazon) {
                                 if (item.name === 'Warehouse 1') imgSrc = '/Warehouse1.png';
                                 else if (item.name === 'Warehouse 2') imgSrc = '/Warehouse2.png';
                                 else if (item.name === 'Warehouse 3') imgSrc = '/Warehouse3.png';
                               }
                               return imgSrc ? (
                                 <img 
                                   src={imgSrc} 
                                   alt={item.name} 
                                   className="w-full h-48 object-cover rounded-t-lg absolute inset-0 z-10"
                                   onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                 />
                               ) : null;
                             })()}
                             <Package size={48} className="text-gray-300 z-0" />
                           </div>
                           <div className="p-4">
                             <h4 className="font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                             {isAmazon && (
                               <>
                                 <p className="text-gray-500 text-sm mt-1 flex items-center"><MapPin size={14} className="mr-1" /> {item.location}</p>
                                 <div className="text-[16px] font-semibold text-[#374151] mt-[12px] mb-[16px] text-left">
                                   {item.name === 'Warehouse 1' && 'Category: Electronics'}
                                   {item.name === 'Warehouse 2' && 'Category: Computers & Home Appliances'}
                                   {item.name === 'Warehouse 3' && 'Category: Fashion & Daily Essentials'}
                                 </div>
                               </>
                             )}
                             {!isAmazon && (
                               <div>
                                 <p className="text-gray-500 text-sm mt-1">{item.cuisine?.join(', ')} • {item.deliveryTime}</p>
                                 <p className="text-sm font-bold text-gray-700 mt-1 flex items-center">
                                   <span className="text-yellow-500 mr-1">★</span> {item.rating}
                                 </p>
                               </div>
                             )}
                             {isAmazon ? (
                               <button 
                                 onClick={() => handleViewWarehouse(item)}
                                 className="mt-4 w-full py-2 rounded-lg text-white font-bold transition bg-[#FF9900] hover:bg-[#F3A847]"
                               >
                                 View Products
                               </button>
                             ) : (
                               <button 
                                 onClick={() => handleViewMenu(item)}
                                 className="mt-4 w-full py-2 rounded-lg text-white font-bold transition bg-[#E23744] hover:bg-[#D12633]"
                               >
                                 View Menu
                               </button>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RESTAURANT MENU TAB */}
                {activeTab === 'menu' && selectedRestaurant && !isAmazon && (
                  <div className="space-y-6">
                    <button onClick={() => setActiveTab('shop')} className="text-gray-500 hover:text-gray-800 flex items-center text-sm font-bold mb-4">
                      <ChevronRight className="rotate-180 mr-1" size={16} /> Back to Restaurants
                    </button>
                    <div className="flex items-center space-x-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                       {selectedRestaurant.image && (
                         <img src={selectedRestaurant.image} alt={selectedRestaurant.name} className="w-24 h-24 rounded-lg object-cover" />
                       )}
                       <div>
                         <h2 className="text-3xl font-bold text-gray-800">{selectedRestaurant.name}</h2>
                         <p className="text-gray-500 mt-1">{selectedRestaurant.cuisine?.join(', ')} • {selectedRestaurant.deliveryTime}</p>
                         <p className="text-sm font-bold text-gray-700 mt-1 flex items-center">
                           <span className="text-yellow-500 mr-1">★</span> {selectedRestaurant.rating}
                         </p>
                       </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Menu Items</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {restaurantMenus.map((menuItem: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition p-4 flex items-center space-x-4">
                           <div className="w-[120px] h-[120px] bg-gray-100 rounded-xl overflow-hidden shrink-0">
                              {menuItem.image ? (
                                <img src={menuItem.image} alt={menuItem.name} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                <Package size={24} className="text-gray-300 m-auto h-full" />
                              )}
                           </div>
                           <div className="flex-1">
                             <h4 className="font-bold text-gray-800">{menuItem.name}</h4>
                             <p className="text-gray-500 text-xs mt-1 line-clamp-1">{menuItem.description}</p>
                             <p className="text-[#E23744] font-bold mt-1">₹{menuItem.price}</p>
                             {(() => {
                               const cartItem = getCartItem(menuItem, false);
                               if (cartItem && cartItem.quantity > 0) {
                                 return (
                                   <div className="mt-2 flex items-center justify-between bg-white border border-[#E23744] rounded-lg overflow-hidden">
                                     <button 
                                       onClick={() => updateCartQty(cartItem._id, cartItem.quantity - 1, false)}
                                       className="px-3 py-1.5 text-[#E23744] hover:bg-gray-50 transition font-bold"
                                     >
                                       -
                                     </button>
                                     <span className="font-bold text-[#E23744] text-sm">
                                       {cartItem.quantity}
                                     </span>
                                     <button 
                                       onClick={() => updateCartQty(cartItem._id, cartItem.quantity + 1, false)}
                                       className="px-3 py-1.5 text-[#E23744] hover:bg-gray-50 transition font-bold"
                                     >
                                       +
                                     </button>
                                   </div>
                                 );
                               }
                               return (
                                 <button 
                                   onClick={() => addToCart({ ...menuItem, restaurantId: selectedRestaurant.restaurantId, restaurantName: selectedRestaurant.name })}
                                   className="mt-2 text-sm w-full py-1.5 rounded-lg text-white font-bold transition bg-[#E23744] hover:bg-[#D12633]"
                                 >
                                   Add to Cart
                                 </button>
                               );
                             })()}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WAREHOUSE PRODUCTS TAB */}
                {activeTab === 'warehouse' && selectedWarehouse && isAmazon && (
                  <div className="space-y-6">
                    <button onClick={() => setActiveTab('shop')} className="text-gray-500 hover:text-gray-800 flex items-center text-sm font-bold mb-4">
                      <ChevronRight className="rotate-180 mr-1" size={16} /> Back to Warehouses
                    </button>
                    <div className="flex items-center space-x-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                       {(() => {
                         let imgSrc = selectedWarehouse.image;
                         if (selectedWarehouse.name === 'Warehouse 1') imgSrc = '/Warehouse1.png';
                         else if (selectedWarehouse.name === 'Warehouse 2') imgSrc = '/Warehouse2.png';
                         else if (selectedWarehouse.name === 'Warehouse 3') imgSrc = '/Warehouse3.png';
                         
                         return imgSrc ? (
                           <div className="w-24 h-24 rounded-lg relative overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                             <img 
                               src={imgSrc} 
                               alt={selectedWarehouse.name} 
                               className="w-full h-full object-cover absolute inset-0 z-10"
                               onError={(e) => { e.currentTarget.style.display = 'none'; }}
                             />
                             <Package size={32} className="text-gray-400 z-0" />
                           </div>
                         ) : (
                           <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                             <Package size={32} className="text-gray-400" />
                           </div>
                         );
                       })()}
                       <div>
                         <h2 className="text-3xl font-bold text-gray-800">{selectedWarehouse.name}</h2>
                         <p className="text-gray-500 mt-1"><MapPin size={16} className="inline mr-1" /> {selectedWarehouse.location}</p>
                       </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Products</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((prod: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition p-4 flex items-center space-x-4">
                           <div className="w-[120px] h-[120px] bg-gray-100 rounded-xl overflow-hidden shrink-0">
                              {prod.image ? (
                                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                <Package size={24} className="text-gray-300 m-auto h-full" />
                              )}
                           </div>
                           <div className="flex-1">
                             <h4 className="font-bold text-gray-800">{prod.name}</h4>
                             <p className="text-gray-500 text-xs mt-1 line-clamp-1">{prod.description}</p>
                             <p className="text-[#FF9900] font-bold mt-1">₹{prod.price}</p>
                             {(() => {
                               const cartItem = getCartItem(prod, true);
                               if (cartItem && cartItem.quantity > 0) {
                                 return (
                                   <div className="mt-2 flex items-center justify-between bg-white border border-[#FF9900] rounded-lg overflow-hidden">
                                     <button 
                                       onClick={() => updateCartQty(cartItem.productId, cartItem.quantity - 1, true)}
                                       className="px-3 py-1.5 text-[#FF9900] hover:bg-gray-50 transition font-bold"
                                     >
                                       -
                                     </button>
                                     <span className="font-bold text-[#FF9900] text-sm">
                                       {cartItem.quantity}
                                     </span>
                                     <button 
                                       onClick={() => updateCartQty(cartItem.productId, cartItem.quantity + 1, true)}
                                       className="px-3 py-1.5 text-[#FF9900] hover:bg-gray-50 transition font-bold"
                                     >
                                       +
                                     </button>
                                   </div>
                                 );
                               }
                               return (
                                 <button 
                                   onClick={() => addToCart(prod)}
                                   className="mt-2 text-sm w-full py-1.5 rounded-lg text-white font-bold transition bg-[#FF9900] hover:bg-[#F3A847]"
                                 >
                                   Add to Cart
                                 </button>
                               );
                             })()}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CART & CHECKOUT TAB */}
                {activeTab === 'cart' && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
                    {cart.items.length === 0 ? (
                      <div className="bg-white p-12 text-center rounded-xl border border-gray-100">
                        <ShoppingCart size={48} className="mx-auto text-[#6B7280] mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">Cart is empty</h3>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                          {cart.items.map((item: any, i: number) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 relative">
                              {!isAmazon && (
                                <button 
                                  onClick={() => removeFromCart(item._id)}
                                  className="absolute top-2 right-2 text-[#DC2626] hover:bg-red-50 p-1 rounded transition opacity-100 visible filter-none"
                                  title="Remove from cart"
                                >
                                  <X size={16} />
                                </button>
                              )}
                              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-4 text-[#6B7280]"/>}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-[#111827] opacity-100 visible filter-none">{isAmazon ? item.name : item.menuName}</h4>
                                {!isAmazon && <p className="text-xs text-[#6B7280] opacity-100 visible filter-none">{item.restaurantName}</p>}
                                <p className="font-bold text-[#EA580C] mt-1 opacity-100 visible filter-none">₹{item.price}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={() => updateCartQty(isAmazon ? item.productId : item._id, item.quantity - 1, isAmazon)} className="w-8 h-8 rounded-full bg-[#F3F4F6] border border-[#D1D5DB] flex items-center justify-center hover:bg-gray-200 text-[#111827] opacity-100 visible filter-none"><Minus size={14}/></button>
                                <span className="font-semibold w-4 text-center text-[#111827] opacity-100 visible filter-none">{item.quantity}</span>
                                <button onClick={() => updateCartQty(isAmazon ? item.productId : item._id, item.quantity + 1, isAmazon)} className="w-8 h-8 rounded-full bg-[#F3F4F6] border border-[#D1D5DB] flex items-center justify-center hover:bg-gray-200 text-[#111827] opacity-100 visible filter-none"><Plus size={14}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit">
                          <h3 className="text-lg font-bold mb-4 text-[#111827] opacity-100 visible filter-none">Order Summary</h3>
                          <div className="flex justify-between mb-2 text-sm"><span className="text-[#374151] opacity-100 visible filter-none">Subtotal</span><span className="font-semibold text-[#111827] opacity-100 visible filter-none">₹{cart.items.reduce((acc: number, cur: any) => acc + (cur.price * cur.quantity), 0)}</span></div>
                          <div className="flex justify-between mb-4 text-sm"><span className="text-[#374151] opacity-100 visible filter-none">Delivery</span><span className="font-bold text-[#15803D] opacity-100 visible filter-none">Free</span></div>
                          <div className="pt-4 border-t border-gray-100 flex justify-between mb-6"><span className="font-bold text-[#111827] opacity-100 visible filter-none">Total</span><span className="font-bold text-xl text-[#111827] opacity-100 visible filter-none">₹{cart.items.reduce((acc: number, cur: any) => acc + (cur.price * cur.quantity), 0)}</span></div>
                          
                          <form onSubmit={handleCheckout}>
                            <button type="submit" className={`w-full py-3 rounded-lg text-white font-bold transition shadow-sm ${
                               isAmazon ? 'bg-[#FF9900] hover:bg-[#F3A847]' : 'bg-[#E23744] hover:bg-[#D12633]'
                            }`}>
                              Place Order (COD)
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                  <div className="space-y-6 max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {orders.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 font-medium">No orders found.</div>
                      ) : (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                              <th className="p-4 font-bold">Order ID</th>
                              <th className="p-4 font-bold">Date</th>
                              <th className="p-4 font-bold">Total</th>
                              <th className="p-4 font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((o: any, i: number) => (
                              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-4 font-mono text-sm font-bold text-blue-600">{o.orderId}</td>
                                <td className="p-4 text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 font-bold text-gray-800">₹{o.amount}</td>
                                <td className="p-4">
                                  <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                                    ['delivered', 'completed'].includes(o.status) ? 'bg-green-100 text-green-700' : 
                                    ['cancelled', 'rejected'].includes(o.status) ? 'bg-red-100 text-red-700' : 
                                    ['pending', 'assigned'].includes(o.status) ? 'bg-orange-100 text-[#FF9900]' :
                                    ['out_for_delivery', 'shipped'].includes(o.status) ? 'bg-purple-100 text-purple-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {o.status.replace(/_/g, ' ')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

             </>
           )}
        </main>
      </div>
    </div>
  );
}
