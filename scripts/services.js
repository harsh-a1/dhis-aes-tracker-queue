/**
 * Created by hisp on 2/12/15.
 */

var bidReportsAppServices = angular.module('bidReportsAppServices', [])
    .service('MetadataService',function(){
       return {
           findValueAgainstId : function (data,idKey,id,valKey){

            for (var i=0;i<data.length;i++){
                if (data[i][idKey]==id){
                    return data[i][valKey]
                }
            }
            return null;
        },
           getOrgUnit : function(id){
               var def = $.Deferred();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../organisationUnits/'+id+".json",
                   success: function (data) {
                       def.resolve(data);
                   }
               });
               return def;
           },
           getCurrentUser : function(){
               var def = $.Deferred();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../me.json?fields=id,name,organisationUnits[id,name]',
                   success: function (data) {
                       def.resolve(data);
                   }
               });
               return def;
           },
           getApexEvents : function(ouId){
               var def = $.Deferred();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../events.json?orgUnit='+ouId+'&program=a9cQSlDVI2n&ouMode=DESCENDANTS&programStage=GOWaC9DJ8ua&skipPaging=true',
                   success: function (data) {
                       def.resolve(data);
                   }
               });
               return def;
           },
           getDistrictEvents : function(ouId){
               var def = $.Deferred();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../events.json?orgUnit='+ouId+'&program=a9cQSlDVI2n&ouMode=DESCENDANTS&programStage=vXu87PSdhWq&order=eventDate:DESC&skipPaging=true',
                   success: function (data) {

                       def.resolve(data);
                   }
               });
               return def;


           }


       }
    })

.service('configurationService', function($http){
    return {
        get: function(key){
            var promise = $http.get(  '../../systemSettings/'+key ).then(function(response){
                return response;
            })
            return promise;
        },
        getAll: function(){
            var promise = $http.get(  '../../systemSettings.json').then(function(response){
                return response;
            })
            return promise;
        },
        getStartsWith: function(startsWith){
            var promise = $.Deferred();
            var instances = []
            this.getAll().then(function(response){

                for (key in response.data){
                    if (key.indexOf(startsWith)!=-1){
                        instances.push(JSON.parse(response.data[key]));
                    }
                }
                promise.resolve(instances);
            })
            return promise;
        },
        save: function(key,value){
            var valueJson = JSON.stringify(value);
            var promise = $http.post('../../systemSettings/'+key,valueJson, {headers: {'Content-Type': 'text/plain;charset=utf-8'}}).then(function (response) {
                return response.data;
            });
            return promise;
        },
        delete: function(key){
            var promise = $http.delete('../../systemSettings/'+key ).then(function(response){
                return response;
            })
            return promise;
        }
    }
})
    .service('DHISMetaDataService', function ($timeout) {


        return {
            getDataElementsWithCategoryCombo : function(){
                var def = $.Deferred();
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../dataElements.json?paging=false&fields=id,name,categoryCombo[*]',
                    success: function (data) {
                        def.resolve(data.dataElements);
                    }
                });
                return def;
            },
            getAllOrgUnitsIdNameAttributeValues : function(){
                var def = $.Deferred();
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../organisationUnits.json?paging=false&fields=id,name,attributeValues[value,attribute[id,name]]',
                    success: function (data) {
                        def.resolve(data.organisationUnits);
                    }
                });
                return def;
            },
            postDataValue : function(dataValueJson,reference){
                var valueJson = JSON.stringify(dataValueJson);

                var def = $.Deferred();
                $.ajax({
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    data: valueJson,
                    url: "../../dataValueSets",
                    success: function (response) {
                        console.log('Data-value Import response: '+response.status);
                        def.resolve({response : response, reference :reference});
                    },
                    error: function (request, textStatus, errorThrown) {

                        console.log(textStatus);
                        console.log(errorThrown);
                        def.resolve({response : request, reference :reference});
                    }
                });
                return def;
            },
            postDataValueObjects : function(def,thiz,objects,index,importSummary){
                if (index == objects.length){
                    def.resolve("done");
                    return;
                }
                $timeout(function(){
                    importSummary.postRequestCount++;

                })
                if (thiz == undefined){
                    thiz = this;
                }
                var valueJson = JSON.stringify(objects[index].dataValues);

                $.ajax({
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    data: valueJson,
                    url: "../../dataValueSets",
                    success: function (response) {
                        console.log('Data-value Import response: '+response.status);
                        objects[index].importResponse = response;
                        return  thiz.postDataValueObjects(def,thiz,objects,index+1,importSummary);
                    },
                    error: function (request, textStatus, errorThrown) {
                        objects[index].importResponse = {request : request};
                        console.log(textStatus);
                        console.log(errorThrown);
                        return thiz.postDataValueObjects(def,thiz,objects,index+1,importSummary);
                    }
                });

            },
            postDataValueObjectsElementWise : function(def,thiz,form,objects,objectIndex,mappingElementIndex,importSummary){
                if (objectIndex == objects.length){
                    def.resolve("Done");
                    return;
                }

                $timeout(function(){
                    importSummary.postRequestCount++;

                })
                if (thiz == undefined){
                    thiz = this;
                }

                dataValueJson = {
                    dataValues : [

                    ]
                };

                if (objects[objectIndex].mappingElements.length == mappingElementIndex){
                    return thiz.postDataValueObjectsElementWise(def,thiz,form,objects,objectIndex+1,0,importSummary);

                }
                dataValueJson.dataValues.push(objects[objectIndex].mappingElements[mappingElementIndex].dataValueJson)

                var valueJson = JSON.stringify(dataValueJson);

                $.ajax({
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    data: valueJson,
                    url: "../../dataValueSets",
                    success: function (response) {
                        console.log('Data-value Import response: '+response.status);
                        objects[objectIndex].mappingElements[mappingElementIndex].importResponse = response;

                        if (response.status == "SUCCESS" && response.conflicts == undefined) {
                            form.successfullyImportedElements.push(objects[objectIndex].mappingElements[mappingElementIndex]);
                        }else{
                            form.importFailedElements.push(objects[objectIndex].mappingElements[mappingElementIndex]);

                        }

                        return  thiz.postDataValueObjectsElementWise(def,thiz,form,objects,objectIndex,mappingElementIndex+1,importSummary);
                    },
                    error: function (request, textStatus, errorThrown) {
                        objects[index].importResponse = {request : request};
                        console.log(textStatus);
                        console.log(errorThrown);
                        form.importFailedElements.push(objects[objectIndex].mappingElements[mappingElementIndex]);

                        return  thiz.postDataValueObjectsElementWise(def,thiz,form,objects,objectIndex,mappingElementIndex+1,importSummary);
                    }
                });
            },
            getAllOrgUnitsBelowParameterOuId : function(OuId,instanceIndex){
                var def = $.Deferred();
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../organisationUnits/'+OuId+'.json?includeDescendants=true&fields=id,name,attributeValues[value,attribute[id,name]]&paging=false',
                    success: function (data) {
                        def.resolve({organisationUnits :data.organisationUnits,instanceIndex : instanceIndex});
                    }
                });
                return def;
            },
            getAllOrgUnitsBelowParameterOuList : function(def,ouList,resultingOuList,index,thiz){

                if (def == undefined)
                {
                    def = $.Deferred();
                }
                if (index == ouList.length){
                    def.resolve(resultingOuList);
                    return;
                }

                if (resultingOuList == undefined){
                    resultingOuList = [];
                }
                if (thiz == undefined){
                    thiz = this;
                }
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../organisationUnits/'+ouList[index].id+'.json?includeDescendants=true&fields=id,name,attributeValues&paging=false',
                    success: function (data) {
                        resultingOuList = resultingOuList.concat(data.organisationUnits);
                        thiz.getAllOrgUnitsBelowParameterOuList(def,ouList,resultingOuList,index+1,thiz);
                    }
                });
                return def;
            },
            getCurrentUserIdNameAndOrgUnit : function(){
                var def = $.Deferred();
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../me.json?fields=id,name,organisationUnits',
                    success: function (data) {
                        def.resolve(data);
                    }
                });
                return def;
            },
            getAllCategoryOptionCombos : function(){
                var def = $.Deferred();
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../categoryOptionCombos.json?fields=id,name&paging=false',
                    success: function (data) {
                        def.resolve(data.categoryOptionCombos);
                    }
                });
                return def;
            }
        }
    })
    .service('utilityService', function (configurationService,DHISMetaDataService) {
        var currentUserInstanceAuthorityMap = undefined;
        var configurationInstances = undefined;

        return {
            prepareIdToObjectMap : function(object,id){
                var map = [];
                for (var i=0;i<object.length;i++){
                    map[object[i][id]] = object[i];
                }
                return map;
            },
            makePeriodFromDate : function(periodId,receivedOn){

                var period = null;
                switch(periodId){
                    case "QJan" :  period =  moment(receivedOn).format('YYYY') + 'Q' + moment(receivedOn).format('Q');
                        break;

                }
                return period;
            },
            getOrgUnitIdByIdentifier : function(identifier,orgUnitAttributeName,orgUnits){

                for (var i=0;i<orgUnits.length;i++){
                    var attributeValues = orgUnits[i].attributeValues;
                    for (var j=0;j<attributeValues.length;j++){
                        if (attributeValues[j].attribute.name == orgUnitAttributeName){
                            if ((""+attributeValues[j].value).toUpperCase() == (""+identifier).toUpperCase())
                                return orgUnits[i].id;
                        }
                    }
                }
                return undefined;
            },
            getInstancesWithAuthorityMap : function(){
                var def = $.Deferred();

                if (configurationInstances != undefined && currentUserInstanceAuthorityMap!=undefined){
                    def.resolve({currentUserInstanceAuthorityMap : currentUserInstanceAuthorityMap , configurationInstances:configurationInstances});
                    return def;
                }
                currentUserInstanceAuthorityMap = [];
                configurationInstances = [];
                var i = 0;
                var instanceIndex=0;
                var j=0;

                configurationService.getStartsWith("dhis2commcare-").then(function(instances){
                    configurationInstances = instances
                    //initialize authorities
                    for (instanceIndex=0;instanceIndex<instances.length;instanceIndex++) {
                        currentUserInstanceAuthorityMap[instances[instanceIndex].appId] = false;
                    }

                    DHISMetaDataService.getCurrentUserIdNameAndOrgUnit().then(function(currentUserDetails){

                        DHISMetaDataService.getAllOrgUnitsBelowParameterOuList(undefined,currentUserDetails.organisationUnits,undefined,0).then(function(organisationUnits){
                            for (instanceIndex=0;instanceIndex<instances.length;instanceIndex++){
                                for ( j=0;j<organisationUnits.length;j++){
                                    if (instances[instanceIndex].dhisSettings.rootOuUid == organisationUnits[j].id){
                                        currentUserInstanceAuthorityMap[instances[instanceIndex].appId] = true;
                                    }
                                }
                            }
                            def.resolve({currentUserInstanceAuthorityMap : currentUserInstanceAuthorityMap , configurationInstances:configurationInstances});
                        })
                    })
                })
                return def;
            },
            getCurrentUser:function(){
                var def = $.Deferred();
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../me.json?',
                    success: function (data) {
                        def.resolve(data);
                    }
                });
                return def;
            }
        }
    })
