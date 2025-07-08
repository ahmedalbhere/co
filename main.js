document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const tableNumberInput = document.getElementById('tableNumber');
    const startOrderBtn = document.getElementById('startOrderBtn');
    const tableNumberDisplay = document.getElementById('tableNumberDisplay');
    const menuSection = document.querySelector('.menu-section');
    const orderSection = document.querySelector('.order-section');
    const confirmationSection = document.querySelector('.confirmation-section');
    const menuItemsContainer = document.getElementById('menuItems');
    const orderItemsContainer = document.getElementById('orderItems');
    const orderNotes = document.getElementById('orderNotes');
    const submitOrderBtn = document.getElementById('submitOrderBtn');
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');
    const newOrderBtn = document.getElementById('newOrderBtn');
    const categoryBtns = document.querySelectorAll('.category-btn');

    // متغيرات التطبيق
    let currentTableNumber = null;
    let currentOrder = [];
    let menuItems = {};

    // استدعاء البيانات من Firebase
    function fetchMenuItems() {
        database.ref('menu').on('value', (snapshot) => {
            menuItems = snapshot.val() || {};
            displayMenuItems('hot-drinks');
        });
    }

    // عرض عناصر القائمة حسب الفئة
    function displayMenuItems(category) {
        menuItemsContainer.innerHTML = '';
        
        if (menuItems[category]) {
            Object.keys(menuItems[category]).forEach(itemId => {
                const item = menuItems[category][itemId];
                const menuItemElement = document.createElement('div');
                menuItemElement.className = 'menu-item';
                menuItemElement.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>${item.description || ''}</p>
                    <p class="price">${item.price} جنيه</p>
                    <button class="add-to-order" data-id="${itemId}" data-category="${category}">إضافة إلى الطلب</button>
                `;
                menuItemsContainer.appendChild(menuItemElement);
            });
        } else {
            menuItemsContainer.innerHTML = '<p>لا توجد عناصر في هذه الفئة</p>';
        }

        // إضافة مستمعين لأزرار الإضافة
        document.querySelectorAll('.add-to-order').forEach(btn => {
            btn.addEventListener('click', addToOrder);
        });
    }

    // إضافة عنصر إلى الطلب
    function addToOrder(e) {
        const itemId = e.target.getAttribute('data-id');
        const category = e.target.getAttribute('data-category');
        const item = menuItems[category][itemId];
        
        // التحقق مما إذا كان العنصر موجودًا بالفعل في الطلب
        const existingItemIndex = currentOrder.findIndex(
            orderItem => orderItem.id === itemId && orderItem.category === category
        );
        
        if (existingItemIndex !== -1) {
            // زيادة الكمية إذا كان العنصر موجودًا
            currentOrder[existingItemIndex].quantity += 1;
        } else {
            // إضافة عنصر جديد إلى الطلب
            currentOrder.push({
                id: itemId,
                category: category,
                name: item.name,
                price: item.price,
                quantity: 1
            });
        }
        
        displayOrderItems();
    }

    // عرض عناصر الطلب
    function displayOrderItems() {
        orderItemsContainer.innerHTML = '';
        
        if (currentOrder.length === 0) {
            orderItemsContainer.innerHTML = '<p>لا توجد عناصر في الطلب</p>';
            return;
        }
        
        currentOrder.forEach((item, index) => {
            const orderItemElement = document.createElement('div');
            orderItemElement.className = 'order-item';
            orderItemElement.innerHTML = `
                <div>
                    <h4>${item.name}</h4>
                    <p>${item.price} جنيه</p>
                </div>
                <div class="quantity-controls">
                    <button class="decrease-quantity" data-index="${index}">-</button>
                    <span>${item.quantity}</span>
                    <button class="increase-quantity" data-index="${index}">+</button>
                    <span class="remove-item" data-index="${index}">×</span>
                </div>
            `;
            orderItemsContainer.appendChild(orderItemElement);
        });
        
        // إضافة مستمعين لأزرار التحكم في الكمية
        document.querySelectorAll('.decrease-quantity').forEach(btn => {
            btn.addEventListener('click', changeQuantity);
        });
        
        document.querySelectorAll('.increase-quantity').forEach(btn => {
            btn.addEventListener('click', changeQuantity);
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', removeItem);
        });
    }

    // تغيير كمية العنصر في الطلب
    function changeQuantity(e) {
        const index = parseInt(e.target.getAttribute('data-index'));
        const isIncrease = e.target.classList.contains('increase-quantity');
        
        if (isIncrease) {
            currentOrder[index].quantity += 1;
        } else {
            if (currentOrder[index].quantity > 1) {
                currentOrder[index].quantity -= 1;
            } else {
                currentOrder.splice(index, 1);
            }
        }
        
        displayOrderItems();
    }

    // إزالة العنصر من الطلب
    function removeItem(e) {
        const index = parseInt(e.target.getAttribute('data-index'));
        currentOrder.splice(index, 1);
        displayOrderItems();
    }

    // بدء طلب جديد
    startOrderBtn.addEventListener('click', () => {
        const tableNumber = tableNumberInput.value.trim();
        
        if (!tableNumber) {
            alert('الرجاء إدخال رقم الطاولة');
            return;
        }
        
        currentTableNumber = tableNumber;
        tableNumberDisplay.textContent = `الطاولة رقم ${tableNumber}`;
        tableNumberInput.value = '';
        
        // إظهار قسم القائمة وإخفاء الأقسام الأخرى
        menuSection.classList.remove('hidden');
        document.querySelector('.table-number-section').classList.add('hidden');
        orderSection.classList.add('hidden');
        confirmationSection.classList.add('hidden');
        
        // إعادة تعيين الطلب الحالي
        currentOrder = [];
    });

    // عرض قسم الطلب عند النقر على زر "عرض الطلب" (يمكن إضافته في واجهة المستخدم)
    function showOrderSection() {
        menuSection.classList.add('hidden');
        orderSection.classList.remove('hidden');
        displayOrderItems();
    }

    // إرسال الطلب إلى Firebase
    submitOrderBtn.addEventListener('click', () => {
        if (currentOrder.length === 0) {
            alert('الرجاء إضافة عناصر إلى الطلب');
            return;
        }
        
        const orderData = {
            tableNumber: currentTableNumber,
            items: currentOrder,
            notes: orderNotes.value.trim(),
            status: 'pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        // حفظ الطلب في Firebase
        database.ref('orders').push(orderData)
            .then(() => {
                // إظهار قسم التأكيد
                orderSection.classList.add('hidden');
                confirmationSection.classList.remove('hidden');
                orderNotes.value = '';
            })
            .catch(error => {
                console.error('Error submitting order:', error);
                alert('حدث خطأ أثناء إرسال الطلب، الرجاء المحاولة مرة أخرى');
            });
    });

    // إلغاء الطلب
    cancelOrderBtn.addEventListener('click', () => {
        currentOrder = [];
        orderNotes.value = '';
        menuSection.classList.remove('hidden');
        orderSection.classList.add('hidden');
    });

    // بدء طلب جديد من قسم التأكيد
    newOrderBtn.addEventListener('click', () => {
        confirmationSection.classList.add('hidden');
        document.querySelector('.table-number-section').classList.remove('hidden');
    });

    // تغيير فئة القائمة
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.getAttribute('data-category');
            displayMenuItems(category);
        });
    });

    // إضافة زر عرض الطلب إلى واجهة المستخدم (يمكن تعديل الواجهة لإضافته)
    // يمكنك إضافة زر في واجهة المستخدم لاستدعاء showOrderSection()

    // بدء التطبيق
    fetchMenuItems();
});
