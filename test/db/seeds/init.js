exports.seed = async function (knex) {
  // This is basically just a copy/paste of `init.sql` in the `bsscraper` repo

  // Just go ctrl+f and replace ; with `),knex.raw(` and then format
  await Promise.all([
    knex.raw(`INSERT INTO bs_product VALUES(2033433)`),
    knex.raw(`INSERT INTO bs_product VALUES(2033436)`),
    knex.raw(`INSERT INTO bs_product VALUES(2034031)`),
    knex.raw(`INSERT INTO bs_product VALUES(2043913)`),
    knex.raw(`INSERT INTO bs_product VALUES(2108382)`),
    knex.raw(`INSERT INTO bs_product VALUES(2110205)`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/vin/rott-vin/sydafrika/drostdy-hof-shiraz-merlot-2108382','Drostdy-Hof Shiraz Merlot','Vin','Rött vin',300.0,61.170000000000001707,13.5,6.6208925944090237791,2108382,'2022-01-19 21:56:57')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-bear-beer-strong-77-2033433','Harboe Bear Beer Strong 7,7%','Öl & Cider','Dansk Öl',32.999999999999999999,2.5499999999999998223,7.7000000000000001776,9.9740932642487045711,2033433,'2022-01-19 21:58:28')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-bear-beer-strong-77-2033433','Harboe Bear Beer Strong 7,7%','Öl & Cider','Dansk Öl',32.999999999999999999,2.5499999999999998223,7.7000000000000001776,9.9740932642487045711,2033433,'2022-01-19 21:58:33')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-viiking-strong-beer-120-2110205','Harboe Viiking Strong Beer 12,0%','Öl & Cider','Dansk Öl',32.999999999999999999,4.25,12.0,9.324009324009324473,2110205,'2022-01-19 21:58:49')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/sprit/likor/minttu-original-black-mint-35-2043913','Minttu Original Black Mint 35%','Sprit','Likör',50.0,88.329999999999998291,35.0,1.981206837993886527,2043913,'2022-01-20 08:59:06')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-bear-beer-strong-77-2033433','Harboe Bear Beer Strong 7,7%','Öl & Cider','Dansk Öl',32.999999999999999999,2.5499999999999998223,7.7000000000000001776,9.9740932642487045711,2033433,'2022-01-20 09:00:23')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/sprit/likor/minttu-original-black-mint-35-2043913','Minttu Original Black Mint 35%','Sprit','Likör',50.0,88.329999999999998291,35.0,1.981206837993886527,2043913,'2022-01-20 09:00:40')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-bear-beer-strong-77-2033433','Harboe Bear Beer Strong 7,7%','Öl & Cider','Dansk Öl',32.999999999999999999,2.5499999999999998223,7.7000000000000001776,9.9740932642487045711,2033433,'2022-01-20 09:00:43')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-bear-beer-strong-77-2033433','Harboe Bear Beer Strong 7,7%','Öl & Cider','Dansk Öl',32.999999999999999999,2.5499999999999998223,7.7000000000000001776,9.9740932642487045711,2033433,'2022-01-20 09:00:53')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-bear-beer-strong-77-2033433','Harboe Bear Beer Strong 7,7%','Öl & Cider','Dansk Öl',32.999999999999999999,2.5499999999999998223,7.7000000000000001776,9.9740932642487045711,2033433,'2022-01-20 09:00:55')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/sprit/likor/minttu-original-black-mint-35-2043913','Minttu Original Black Mint 35%','Sprit','Likör',50.0,88.329999999999998291,35.0,1.981206837993886527,2043913,'2022-01-20 09:01:20')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/sprit/likor/minttu-original-black-mint-35-2043913','Minttu Original Black Mint 35%','Sprit','Likör',50.0,88.329999999999998291,35.0,1.981206837993886527,2043913,'2022-01-20 09:01:22')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-luxury-beer-gold-59-2033436','Harboe Luxury Beer Gold 5,9%','Öl & Cider','Dansk Öl',32.999999999999999999,2.6800000000000001598,5.9000000000000003552,7.2570725707257075498,2033436,'2022-01-24 20:54:25')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-bear-beer-strong-77-2033433','Harboe Bear Beer Strong 7,7%','Öl & Cider','Dansk Öl',32.999999999999999999,2.5499999999999998223,7.7000000000000001776,9.9740932642487045711,2033433,'2022-01-24 20:54:37')`),
    knex.raw(`
    INSERT INTO bs_product_history_entry VALUES('https://www.bordershop.com/se/vin/vitt-vin/sydafrika/drostdy-hof-chenin-blanc-steen-2034031','Drostdy-Hof Chenin Blanc Steen','Vin','Vitt vin',300.0,61.170000000000001707,12.0,5.8852378616969103219,2034031,'2022-01-24 20:54:52')`),
    knex.raw(`INSERT INTO dead_bs_product VALUES(2034031,'2022-01-24 20:57:49', NULL)`),
    knex.raw(`
    INSERT INTO bs_product_review VALUES(2110205,4.5,replace('Helt enkelt bäst.\nSmaken är som baken, smakar mest skit.','\n',char(10)),'Emil','2022-01-19 21:59:07')`),
  ]);
};
