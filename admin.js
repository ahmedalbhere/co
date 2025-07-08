document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const navBtns = document.querySelectorAll('.nav-btn');
    const adminSections = document.querySelectorAll('.admin-section');
    const ordersSection = document.getElementById('orders-section');
    const menuSection = document.getElementById('menu-section');
    const ordersList = document.getElementById('ordersList');
    const orderFilter = document.getElementById('order-filter');
    const categoriesList = document.getElementById('categoriesList');
    const itemsList = document.getElementById('itemsList');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addItemBtn = document.getElementById('addItemBtn');
    
    // عناصر المودال
    const orderModal = document.getElementById('orderModal');
    const orderDetails = document.getElementById('orderDetails');
    const orderStatus = document.getElementById('orderStatus');
    const updateOrderBtn = document.getElementById('updateOrderBtn');
    const closeModals = document.querySelectorAll('.close-modal');
    
    const categoryModal = document.getElementById('categoryModal');
    const categoryModalTitle = document.getElementById('categoryModalTitle');
    const categoryName = document.getElementById('categoryName');
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    
    const itemModal = document.getElementById('itemModal');
    const itemModalTitle = document.getElementById('itemModalTitle');
    const itemCategory = document.getElementById('itemCategory');
    const itemName = document.getElementById('itemName');
    const itemPrice = document.getElementById('itemPrice');
    const itemDescription = document.getElementById('itemDescription');
    const saveItemBtn = document.getElementById('saveItemBtn');
    
    // متغيرات التطبيق
    let currentOrderId = null;
    let currentCategoryId = null;
    let currentItemId = null;
    let isEditing = false;
    let menuCategories = {};
    let menuItems = {};

    // تبديل الأقسام
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('data-section');
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            adminSections.forEach(section => section.classList.add('hidden'));
            document.getElementById(`${sectionId}-section`).classList.remove('hidden');
            
            if (sectionId === 'menu') {
                fetchMenuCategories();
            }
        });
    });

    // إغلاق النماذج
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            orderModal.classList.add('hidden');
            categoryModal.classList.add('hidden');
            itemModal.classList.add('hidden');
            resetForms();
        });
    });

    // إغلاق النماذج عند النقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target === orderModal) orderModal.classList.add('hidden');
        if (e.target === categoryModal) categoryModal.classList.add('hidden');
        if (e.target === itemModal) itemModal.classList.add('hidden');
    });

    // استدعاء الطلبات من Firebase
    function fetchOrders(filter = 'all') {
        let ordersRef = database.ref('orders').orderByChild('timestamp');
        
        ordersRef.on('value', (snapshot) => {
            ordersList.innerHTML = '';
            const orders = snapshot.val() || {};
            
            Object.keys(orders).forEach(orderId => {
                const order = orders[orderId];
                
                if (filter === 'all' || order.status === filter) {
                    const orderCard = document.createElement('div');
                    orderCard.className = 'order-card';
                    
                    const statusClass = `status-${order.status}`;
                    const statusText = getStatusText(order.status);
                    
                    orderCard.innerHTML = `
                        <h3>الطاولة رقم ${order.tableNumber}</h3>
                        <p>عدد العناصر: ${order.items.reduce((total, item) => total + item.quantity, 0)}</p>
                        <p>التاريخ: ${new Date(order.timestamp).toLocaleString()}</p>
                        <div class="order-status ${statusClass}">${statusText}</div>
                        <button class="view-order-btn" data-id="${orderId}">عرض التفاصيل</button>
