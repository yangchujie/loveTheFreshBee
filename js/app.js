function resetFontSize() {
    let windowW = document.documentElement.clientWidth;
    let scale = windowW / 320;
    let newSize = 10 * scale;
    document.querySelector("html").style.fontSize = newSize + "px";
}//重置浏览器的rem值
window.addEventListener("resize", function () {
    resetFontSize();
});//监听浏览器变化
resetFontSize();

let app = angular.module("MyApp", ["ngRoute"]);
app.config(["$routeProvider", function ($routeProvider) {
    $routeProvider
        .when("/homePage", {
            templateUrl: "./view/homePage.html",
            controller: "Home"
        })
        .when("/market", {
            templateUrl: "./view/market.html",
            controller: "Market"
        })
        .when("/cart", {
            templateUrl: "./view/cart.html",
            controller: "Cart"
        })
        .when("/mine", {
            templateUrl: "./view/mine.html",
            // controller:"Mine"
        })
        .otherwise({
            redirectTo: "/homePage"
        })
}]);
app.controller("nowIndex", ["$scope", "$location", function ($scope, $location) {
    $scope.$on("$locationChangeSuccess", function () {
        if ($location.path().indexOf("homePage") != -1) {
            $scope.navIndex = 0;
        }
        if ($location.path().indexOf("market") != -1) {
            $scope.navIndex = 1;
        }
        if ($location.path().indexOf("cart") != -1) {
            $scope.navIndex = 2;
        }
        if ($location.path().indexOf("mine") != -1) {
            $scope.navIndex = 3;
        }
    })
}]);//判断当前刷新后的页面
app.controller("Home", ["$scope", "$http", "MyService", function ($scope, $http, MyService) {
    $http.get("./js/index.json")
        .success(function (data) {
            $scope.data = data;
            $scope.categories = data.data.act_info[2].act_rows;
        });
    $scope.addProduct = function (item) {
        MyService.addCartData(item)
    }
}]);
app.controller("Market", ["$scope", "$http", "MyService", function ($scope, $http, MyService) {
    $scope.filterBol = false;
    $scope.sortBol = false;
    $scope.designate = 0;
    $scope.sortIndex = 0;
    $scope.activeCid = '全部分类';
    $scope.sortList = ['综合排序', '销量最高', '价格最高', '价格最低'];
    $scope.categories = MyService.getCategories();
    $scope.products = MyService.getProduct();
    $scope.getCategoryId = function (id, index) {
        $scope.designate = 0;
        $scope.categoryActiveId = id;
        MyService.setIndex(index);
        $scope.activeIndex = index;
        $scope.activeCid = '全部分类';
    };
    if ($scope.categories.length == 0) {
        $http.get("./js/category.json")
            .success(function (data) {
                $scope.categories = data.data.categories;//商品分类数据
                $scope.products = data.data.products;//商品数据
                $scope.categoryActiveId = data.data.categories[0].id;
                $scope.activeIndex = 0;
                MyService.setCategories(data.data.categories);
                MyService.setProduct(data.data.products);
            })
    } else {
        $scope.categoryActiveId = $scope.categories[MyService.getIndex()].id;
        $scope.activeIndex = MyService.getIndex();
    }
    $scope.getDesignate = function (index, item) {
        $scope.designate = index;
        $scope.activeCid = item.name
    };
    $scope.changeSort = function (index, item) {
        $scope.sortIndex = index;
        switch (item) {
            case '综合排序':
                $scope.sortType = '';
                $scope.priceSortBol = true;
                break;
            case '价格最高':
                $scope.sortType = 'price';
                $scope.priceSortBol = true;
                break;
            case '价格最低':
                $scope.sortType = 'price';
                $scope.priceSortBol = false;
                break;
            case '销量最高':
                $scope.sortType = 'product_num';
                $scope.priceSortBol = true;
                break;
        }
    };
    $scope.cidFilter = function (item) {
        if ($scope.activeCid === '全部分类') {
            return true
        } else {
            return item.cids[item.child_cid] === $scope.activeCid
        }
    }
}]);
app.controller("Cart", ["$scope", "MyService", function ($scope, MyService) {
    $scope.cartData = MyService.getCartData();

    function isCartHasProduct() {
        if ($scope.cartData.length === 0) {
            $scope.isProductExist = true;
        } else {
            $scope.isProductExist = false;
        }
    }

    isCartHasProduct();
    $scope.addProduct = function (item) {
        MyService.addCartData(item)
    };
    $scope.subProduct = function (item) {
        if (item.num >= 1) {
            MyService.subCartData(item)
        }
        isCartHasProduct();
    };
    $scope.total = function () {
        let total = 0;
        for (let i = 0; i < $scope.cartData.length; i++) {
            if ($scope.cartData[i].selectBol) {
                total += ($scope.cartData[i].num * $scope.cartData[i].price)
            }
        }
        return total.toFixed(1)
    };

    $scope.isClickBol = true;
    $scope.selectAll = function () {
        $scope.isClickBol = !$scope.isClickBol;
        for (let item of $scope.cartData) {
            if (!$scope.isClickBol) {
                item.selectBol = false;
            } else {
                item.selectBol = true;
            }
        }
    };
    $scope.oneSelect = function (item) {
        item.selectBol = !item.selectBol;
        if (!item.selectBol) {
            $scope.isClickBol = false;
        } else {
            $scope.isClickBol = true;
        }
    }
}]);
app.factory("MyService", [function () {
    let categories = [];
    let products = {};
    let cartData = [];
    let saveIndex = 0;
    return {
        setCategories: function (data) {
            categories = data
        },
        getCategories: function () {
            return categories;
        },
        setIndex: function (index) {
            saveIndex = index;
        },
        getIndex: function () {
            return saveIndex;
        },
        setProduct: function (data) {
            products = data
        },
        getProduct: function () {
            return products;
        },
        getCartData: function () {
            return cartData;
        },
        addCartData: function (item) {
            let productBol = true;
            for (let i = 0; i < cartData.length; i++) {
                if (cartData[i].id === item.id) {
                    cartData[i].num++;
                    productBol = false
                }
            }
            if (productBol) {
                item.num = 1;
                item.selectBol = true;
                cartData.push(item)
            }
        },
        subCartData: function (item) {
            if (item.num > 1) {
                item.num--;
            } else {
                item.num = 0;
                let index = cartData.indexOf(item);
                cartData.splice(index, 1)
            }
        }
    }
}])