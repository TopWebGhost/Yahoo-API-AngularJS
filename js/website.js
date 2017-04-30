angular.module('website', ['ngRoute', '720kb.datepicker']).
    config(function ($routeProvider) {
        $routeProvider.
            when('/detail/:symbol?', {templateUrl: 'partials/detail.html', controller: 'DetailCtrl'}).
            when('/home', {templateUrl: 'partials/home.html', controller: 'HomeCtrl'}).
            when('/watchlist', {templateUrl: 'partials/watchlist.html', controller: 'WatchCtrl'}).
            otherwise({redirectTo: '/home'});
    })
    .controller('DetailCtrl', function ($scope, $http, $routeParams) {
        $scope.symbol = $routeParams.symbol;
        $scope.result = {};
        $scope.chartData = [];
        $scope.chartRanges= [
            {id: '1d', text: '1d', interval: '1m'},
            {id: '5d', text: '5d', interval: '5m'},
            {id: '1mo', text: '1m', interval: '1d'},
            {id: '6mo', text: '6m', interval: '1d'},
            {id: '1y', text: '1y', interval: '1d'},
            {id: '5y', text: '5y', interval: '1wk'},
            {id: 'max', text: 'max', interval: '1mo'}
        ];
        $scope.currentView = 0;
        $scope.chartOptions = {};
        //$scope.formatDate = function(date) {
        //    var day = date.getDate();
        //    day = day > 9 ? day:'0'+day;
        //    var month = date.getMonth() + 1;
        //    month = month > 8 ? month:'0'+month;
        //    var year = date.getFullYear();
        //    var result = year + '-' + month + '-' + day;
        //    return result;
        //}
        $scope.selectDate = function(interval) {
            $scope.currentView = interval;
            $scope.getChartData($scope.chartRanges[$scope.currentView]);
        }
        $scope.getData = function() {

            var url = "https://query.yahooapis.com/v1/public/yql";
            var data = encodeURIComponent("select * from yahoo.finance.quotes where symbol in ('" +$scope.symbol+ "')");

            var str1 = url.concat("?q=",data);
            str1=str1.concat("&format=json&diagnostics=true&env=store://datatables.org/alltableswithkeys&callback=");
            $http.get(str1)

                .success(function(data, status, headers, config) {
                    if(data.query.results == null) {
                        console.log("No Valid Results could be Returned!!")
                    }
                    else {
                        $scope.result = data.query.results.quote;
                    }
                })

                .error(function(data, status, headers, config) {
                    var err = status + ", " + data;
                    $scope.result = "Request failed: " + err;
                });
        }
        $scope.buildChartData = function() {
            $scope.chartOptions = {
                title: {
                    text: ''
                },
                xAxis: {
                    type: 'datetime'
                },
                yAxis: {
                    title: {
                        text: ''
                    }
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    area: {
                        fillColor: {
                            linearGradient: {
                                x1: 0,
                                y1: 0,
                                x2: 0,
                                y2: 0
                            },
                            stops: [
                                [0, Highcharts.getOptions().colors[0]],
                                [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                            ]
                        },
                        marker: {
                            radius: 2
                        },
                        lineWidth: 1,
                        states: {
                            hover: {
                                lineWidth: 1
                            }
                        },
                        threshold: null
                    }
                },
                series: [{
                    type: 'area',
                    name: 'Volume',
                    data: $scope.chartData
                }]
            };
        }
        $scope.getChartData = function(range) {
            var url = "https://yahoo-ng2scraper.herokuapp.com/chart/" + $scope.symbol + "/" + range.id + "/" + range.interval;

            $http.get(url)

                .success(function(data, status, headers, config) {
                    console.log(data.chart.result[0].indicators.quote[0].volume.length);
                    var tempChartData = [];

                    data.chart.result[0].indicators.quote[0].volume.forEach(function(volume, index) {
                        if(volume !== null) {
                            var temp = [];
                            temp.push(data.chart.result[0].timestamp[index]);
                            temp.push(volume);
                            tempChartData.push(temp);
                        }
                    })
                    $scope.chartData = tempChartData;
                    console.log($scope.chartData);
                    $scope.buildChartData();
                })

                .error(function(data, status, headers, config) {
                    var err = status + ", " + data;
                    $scope.result = "Request failed: " + err;
                });
        }
        $scope.selectDate($scope.currentView);
        $scope.getData();
    })
    .controller('HomeCtrl', function ($scope, $http, $q, $location) {
        $scope.symbols = ['YHOO', 'goog', 'msft', 'NKE', 'MCD', 'SHOP', 'IBM'];
        $scope.results = [];
        $scope.news = [];

        $scope.lookup = function(symbol) {
            $location.path( "detail/" + symbol );
        }
        $scope.dedupe = function(arr) {
            return arr.reduce(function (p, c) {
                var id = c.id;
                if (p.temp.indexOf(id) === -1) {
                    p.out.push(c);
                    p.temp.push(id);
                }
                return p;
            }, { temp: [], out: [] }).out;
        }

        $scope.getTopFive = function() {
            var url = "https://yahoo-ng2scraper.herokuapp.com/scrape";
            $http.get(url)
                .success(function(data) {
                    var symbols = data.text;
                    $scope.symbols = symbols.split(',');
                    $scope.getData();
                })
                .error(function(data) {
                    console.log('error' + data);
                })
        }
        $scope.getData = function() {

            var url = "https://query.yahooapis.com/v1/public/yql";
            var symbols = "";
            $scope.symbols.forEach(function(symbol) {
                symbols += "'" + symbol + "',";
            });
            symbols = symbols.substring(0, symbols.length - 1);
            console.log(symbols);
            var data = encodeURIComponent("select * from yahoo.finance.quotes where symbol in (" +symbols+ ")");

            var str1 = url.concat("?q=",data);
            str1=str1.concat("&format=json&diagnostics=true&env=store://datatables.org/alltableswithkeys&callback=");
            //https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20('YHOO'%2C'AAPL'%2C'GOOG'%2C'MSFT')&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=
            console.log(str1);
            $http.get(str1)

                .success(function(data, status, headers, config) {
                    console.log("success data, status="+ JSON.stringify(data) + status);
                    if(data.query.results == null) {
                        console.log("No Valid Results could be Returned!!")
                    }
                    else {
                        var tempData = [];
                        data.query.results.quote.forEach(function(quote) {
                            var tempJson = {};
                            tempJson.symbol = quote.symbol;
                            tempJson.name = quote.Name;
                            tempJson.lastPrice = quote.LastTradePriceOnly;
                            tempJson.volume = quote.Volume;
                            tempJson.yearRange = quote.YearRange;
                            tempJson.percentChange = quote.PercentChange;
                            tempJson.previousClose = quote.PreviousClose;
                            tempData.push(tempJson);
                        });
                        tempData.sort(function(a, b) {
                           console.log(a.percentChange, b.percentChange, parseFloat(a.percentChange));
                            return parseFloat(b.percentChange) - parseFloat(a.percentChange);
                        });
                        if(tempData.length > 5) {
                            tempData = tempData.slice(0, 5);
                        }
                        $scope.results = tempData;
                        var tempSymbols = [];
                        tempData.forEach(function(data){
                           tempSymbols.push(data.symbol);
                        });

                        $scope.getNews(tempSymbols);
                    }
                })

                .error(function(data, status, headers, config) {
                    var err = status + ", " + data;
                    $scope.result = "Request failed: " + err;
                });
        }
        $scope.getNews = function(symbols) {
            var tempNews = [];
            var promises = [];
            for(var i = 0; i < symbols.length; i++) {
                var url = "https://yahoo-ng2scraper.herokuapp.com/news/" + symbols[i];
                var requestPromise = $http.get(url).then(function(data) {
                        tempNews = tempNews.concat(data.data.Content.result);
                    }, function(data) {
                        console.log('error' + data);
                    });
                promises.push(requestPromise);
            }
            $q.all(promises).then(function() {
                tempNews.sort(function(a, b) {
                    return b.provider_publish_time - a.provider_publish_time;
                });
                $scope.news = $scope.dedupe(tempNews);
            });
        }
        $scope.refresh = function() {
            $scope.getTopFive();
        }
        $scope.getTopFive();

    })
    .controller('WatchCtrl', function ($scope, $http, $q) {
        $scope.symbol = "";
        $scope.price = "";
        $scope.myList = [];
        $scope.results = [];
        $scope.getData = function() {
            var url = "https://query.yahooapis.com/v1/public/yql";
            var symbols = "";
            $scope.myList.forEach(function(symbol) {
                symbols += "'" + symbol.symbol + "',";
            });
            symbols = symbols.substring(0, symbols.length - 1);
            var data = encodeURIComponent("select * from yahoo.finance.quotes where symbol in (" +symbols+ ")");

            var str1 = url.concat("?q=",data);
            str1=str1.concat("&format=json&diagnostics=true&env=store://datatables.org/alltableswithkeys&callback=");
            //https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20('YHOO'%2C'AAPL'%2C'GOOG'%2C'MSFT')&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=
            $http.get(str1)

                .success(function(data, status, headers, config) {
                    console.log("success data, status="+ JSON.stringify(data) + status);
                    if(data.query.results == null) {
                        console.log("No Valid Results could be Returned!!")
                    }
                    else {
                        var tempData = [];
                        if(angular.isArray(data.query.results.quote)) {
                            data.query.results.quote.forEach(function(quote) {
                                var index = -1;
                                for (var i = 0; i < $scope.myList.length; i++) {
                                    if(quote.symbol.toLowerCase() === $scope.myList[i].symbol.toLowerCase())
                                        index = i;
                                }
                                if(index == -1) {
                                    return;
                                }
                                if(!quote.Name) {
                                    $scope.myList.splice(index, 1);
                                    return ;
                                }
                                $scope.myList[index].currentPrice = quote.LastTradePriceOnly;
                            });
                        } else {
                            if(!data.query.results.quote.Name) {
                                $scope.myList.splice(0, 1);
                                return ;
                            }
                            $scope.myList[0].currentPrice = data.query.results.quote.LastTradePriceOnly;
                        }

                    }
                })

                .error(function(data, status, headers, config) {
                    var err = status + ", " + data;
                    $scope.result = "Request failed: " + err;
                });
        }
        $scope.add = function() {
            var index = -1;
            for (var i = 0; i < $scope.myList.length; i++) {
                if($scope.myList[i].symbol.toLowerCase() === $scope.symbol.toLowerCase())
                    index = i;
            }
            if(index != -1) {
                return;
            }
            $scope.myList.push({symbol: $scope.symbol, wishPrice: $scope.price});
            $scope.getData();
        }
    })
    .directive('hcChart', function () {
        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                options: '='
            },
            link: function (scope, element) {
                Highcharts.chart(element[0], scope.options);
                scope.$watch('options', function(newVal) {
                    if (newVal) {
                        console.log(scope.options);
                        Highcharts.chart(element[0], scope.options);
                    }
                }, true);
                scope.$on('resize', function () {
                    console.log('resizeing');
                });
            }
        };
    })