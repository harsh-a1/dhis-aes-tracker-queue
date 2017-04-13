/**
 * Created by hisp on 1/12/15.
 */

bidReportsApp
.controller('homeController', function( $rootScope,
                                         $scope,$timeout,$window,
                                      MetadataService,
                                        utilityService){


    $scope.goToDashboard = function(ev){
        ev.clicked=true;
        var base = location.protocol + '//' + location.host+"/aes";//+window.location.pathname;

        $window.open(base+'/dhis-web-tracker-capture/index.html#/dashboard?tei='+ev.trackedEntityInstance+'&program=a9cQSlDVI2n&ou='+$scope.ouId, '_blank');


    }
    function findValueAgainstId  (data,idKey,id,valKey){

        for (var i=0;i<data.length;i++){
            if (data[i][idKey]==id){
                return data[i][valKey]
            }
        }
        return null;
    }

    var ouId = undefined;
    MetadataService.getCurrentUser().then(function(user){
        if (user.organisationUnits.length <=0){alert("No Org UNit assigned"); return}

        ouId = user.organisationUnits[0].id;
        $scope.ouId = ouId;

        MetadataService.getApexEvents(ouId).then(function(apexEvents){
            $scope.apexEventsMap = utilityService.prepareIdToObjectMap(apexEvents.events,"enrollment");

            MetadataService.getDistrictEvents(ouId).then(function(districtEvents){
                $scope.districtEventsMap = utilityService.prepareIdToObjectMap(districtEvents.events,"enrollment");

                var events = districtEvents.events;
                var filtered_events = [];
                for(var i=0;i<events.length;i++){
                    if ($scope.apexEventsMap[events[i].enrollment]){
                        continue;
                    }
                    var typeStr = "";
                    //csf sample
                    var csf_value = findValueAgainstId(events[i].dataValues,"dataElement","tFZQIt6d9pk","value")
                    if (csf_value){typeStr += " [CSF]"}

                    var serum_value = findValueAgainstId(events[i].dataValues,"dataElement","tFZQIt6d9pk","value")
                    if (serum_value){typeStr += " [Serum]"}

                    var wholeBlood_value = findValueAgainstId(events[i].dataValues,"dataElement","tFZQIt6d9pk","value")
                    if (wholeBlood_value){typeStr += " [Whole blood]"}
                    debugger
                    if (typeStr.length >0){
                        events[i].typeStr = typeStr;
                        events[i].clicked = false;

                        filtered_events.push(events[i])
                    }

                }
                $timeout(function(){
                    $scope.queueEvents = filtered_events;
                })

            })
        })
    })


    });
