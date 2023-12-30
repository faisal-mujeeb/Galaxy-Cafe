const Menu = require('../../../models/menu');

function cartController() {
  return {
    async index(req, res) {

      const data = await Menu.find({
        menuType: {
          "$in": ["Flippin Deals", "Burgers", "Hot Dogs","Sides","Drinks","Dips"]
        }
      });
      const menus = data.map(menu => menu.toObject());

      const drinks = [],
            hotdogs =[],
            flippin=[],
            dips=[],
            burgers = [],
            sides = [];

      menus.forEach(item => {
        if (item.menuType === 'Drinks') {
          drinks.push(item);
        } else if (item.menuType === 'Sides') {
          sides.push(item);
        } else if (item.menuType === 'Hot Dogs') {
          hotdogs.push(item);
        }
        else if(item.menuType === 'Burgers')
          burgers.push(item);
        else if(item.menuType === 'Dips')
          dips.push(item);
        else if(item.menuType === 'Flippin Deals')
          flippin.push(item);
      });

      const additionalMenus = [
        ...drinks.sort(() => 0.5 - Math.random()).slice(0, 2),
        ...sides.sort(() => 0.5 - Math.random()).slice(0, 2),
        ...flippin.sort(() => 0.5 - Math.random()).slice(0, 2),
        ...dips.sort(() => 0.5 - Math.random()).slice(0, 2),
        ...burgers.sort(() => 0.5 - Math.random()).slice(0, 2),
        ...hotdogs.sort(() => 0.5 - Math.random()).slice(0, 2),
      ];

      res.render('customer/cart', {
        menus: additionalMenus
      });

    },
    addItem(req, res) {

      // check if empty cart
      if (!req.session.cart) {
        req.session.cart = {  
          items: {},
          totalQty: 0,
          totalPrice: 0
        }
      }
      let cart = req.session.cart;

      // check if items not in cart
      if (!cart.items[req.body._id]) {
        if (req.body.menuType === 'Pizza' || req.body.menuType === 'pizzamania') {
          cart.items[req.body._id] = [{
            item: req.body,
            qty: 1
          }]
        } else {
          cart.items[req.body._id] = {
            item: req.body,
            qty: 1
          }
        }
      } else {
        if (req.body.menuType !== 'Pizza' && req.body.menuType !== 'pizzamania') {
          cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1;
        } else {
          const alreadyAdded = cart.items[req.body._id].filter(it => it.item.size === req.body.size && it.item.crust === req.body.crust);
          if (alreadyAdded.length > 0) {
            const index = cart.items[req.body._id].findIndex(it => it.item.size === req.body.size && it.item.crust === req.body.crust);
            cart.items[req.body._id][index].qty = cart.items[req.body._id][index].qty + 1
          } else {
            cart.items[req.body._id].push({
              item: req.body,
              qty: 1
            })
          }
        }
      }
      cart.totalQty = cart.totalQty + 1;
      cart.totalPrice = cart.totalPrice + req.body.price;

      return res.json({
        cart
      })
    },
    removeItem(req, res) {

      let cart = req.session.cart;
      // console.log(cart);
      if (Array.isArray(cart.items[req.body._id])) {

        if (cart.items[req.body._id].length > 1) {
          return res.json({
            status: 'failed'
          });
        } else {
          if (cart.items[req.body._id][0].qty === 1) {
            delete cart.items[req.body._id];
          } else {
            cart.items[req.body._id][0].qty = cart.items[req.body._id][0].qty - 1
          }
          cart.totalQty = cart.totalQty - 1;
          cart.totalPrice = cart.totalPrice - req.body.price;
          return res.json({
            status: 'ok',
            cart
          });
        }
      } else {
        if (cart.items[req.body._id].qty === 1) {
          delete cart.items[req.body._id];
        } else {
          cart.items[req.body._id].qty = cart.items[req.body._id].qty - 1
        }
      }

      cart.totalQty = cart.totalQty - 1;
      cart.totalPrice = cart.totalPrice - req.body.price;
      return res.json({
        status: 'ok',
        cart
      })
    },
    deleteItem(req, res) {

      let cart = req.session.cart;
      // console.log(cart, req.body);
      console.log(cart);
      if (Array.isArray(cart.items[req.body.item._id])) {

        if (cart.items[req.body.item._id].length === 1) {
          delete cart.items[req.body.item._id];
        } else {
          const index = cart.items[req.body.item._id].findIndex(it => it.item.crust === req.body.item.crust && it.item.size === req.body.item.size);
          cart.items[req.body.item._id].splice(index, 1);
        }
      } else {
        delete cart.items[req.body.item._id];
      }

      cart.totalQty = cart.totalQty - req.body.qty;
      cart.totalPrice = cart.totalPrice - (req.body.item.price * req.body.qty);
      return res.json({
        status: 'ok',
        cart: req.session.cart
      })
    },
  };
}

module.exports = cartController;