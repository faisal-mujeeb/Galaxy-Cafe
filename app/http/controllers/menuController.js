const Menu = require('../../models/menu');

function menuController() {
  return {
    async index(req, res) {

      try {

        const data = await Menu.find();
        const allMenus = data.map(menu => menu.toObject());
        // console.log(data);
        const menus = allMenus.reduce((menus, item) => {
          const group = (menus[item.menuType] || []);
          group.push(item);
          menus[item.menuType] = group;
          return menus;
        }, {});
        // console.log(allMenus);
        // console.log(menus.Pizza);
        const veg = [],
          nonveg = [];
        const shuffled = menus.Pizza.sort(() => 0.5 - Math.random());

        const modified = menus.Pizza.map(item => {
          if (item.menuType === 'Pizza') {
            // console.log(item);
             let price = item.options.prices.filter(p => p.size === 'regular')[0].crusts[0] ;
            //  console.log(price);
            item['price'] = price;
            // console.log(price);
          } 
          return item;
        });

        modified.forEach(item => {
          if (item.foodType === 'veg') {
            veg.push(item);
          } else {
            nonveg.push(item);
          }
        }
        );


        // res.json(modified)

        res.render('menus', {
          menus: {
            ...menus,
            veg,
            nonveg,
            topMenu: shuffled.slice(0, 12)
          }
        });

      } catch (error) {
        console.log(error);
        process.exit();
      }
    },
  };
}

module.exports = menuController;