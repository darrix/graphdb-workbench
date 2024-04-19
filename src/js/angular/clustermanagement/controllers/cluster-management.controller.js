import 'angular/rest/cluster.rest.service';
import 'angular/clustermanagement/services/remote-locations.service';
import 'angular/clustermanagement/services/cluster-view-context.service';
import 'angular/clustermanagement/controllers/remove-nodes.controller';
import 'angular/clustermanagement/controllers/create-cluster.controller';
import 'angular/clustermanagement/controllers/edit-cluster.controller';
import 'angular/clustermanagement/controllers/delete-cluster.controller';
import 'angular/clustermanagement/controllers/add-location.controller';
import 'angular/clustermanagement/controllers/add-nodes.controller';
import 'angular/clustermanagement/controllers/replace-nodes.controller';
import {isString} from "lodash";
import {LinkState, NodeState} from "../../models/clustermanagement/states";
import {DELETE_CLUSTER, UPDATE_CLUSTER} from "../events";

const modules = [
    'ui.bootstrap',
    'graphdb.framework.core.services.repositories',
    'graphdb.framework.rest.repositories.service',
    'graphdb.framework.rest.cluster.service',
    'graphdb.framework.clustermanagement.services.cluster-view-context-service',
    'graphdb.framework.clustermanagement.services.remote-locations',
    'graphdb.framework.clustermanagement.controllers.remove-nodes',
    'graphdb.framework.clustermanagement.controllers.create-cluster',
    'graphdb.framework.clustermanagement.controllers.edit-cluster',
    'graphdb.framework.clustermanagement.controllers.delete-cluster',
    'graphdb.framework.clustermanagement.controllers.add-location',
    'graphdb.framework.clustermanagement.controllers.add-nodes',
    'graphdb.framework.clustermanagement.controllers.replace-nodes',
    'toastr',
    'pageslide-directive'
];

angular
    .module('graphdb.framework.clustermanagement.controllers.cluster-management', modules)
    .controller('ClusterManagementCtrl', ClusterManagementCtrl);

ClusterManagementCtrl.$inject = ['$scope', '$http', '$q', 'toastr', '$repositories', '$uibModal', '$sce', '$jwtAuth',
    '$window', '$interval', 'ModalService', '$timeout', 'ClusterRestService', '$location', '$translate', 'RemoteLocationsService', '$rootScope', 'ClusterViewContextService'];

function ClusterManagementCtrl($scope, $http, $q, toastr, $repositories, $uibModal, $sce, $jwtAuth,
    $window, $interval, ModalService, $timeout, ClusterRestService, $location, $translate, RemoteLocationsService, $rootScope, ClusterViewContextService) {

    // =========================
    // Private variables
    // =========================

    const DELETED_ON_NODE_MESSAGE = 'Cluster was deleted on this node.';
    const w = angular.element($window);
    let updateRequest;

    // =========================
    // Public variables
    // =========================

    $scope.loader = true;
    $scope.isLeader = false;
    $scope.currentNode = null;
    $scope.clusterModel = {};
    $scope.NodeState = NodeState;
    $scope.leaderChanged = false;
    $scope.currentLeader = null;
    // Holds child context
    $scope.childContext = {};
    $scope.showClusterConfigurationPanel = false;

    // =========================
    // Public functions
    // =========================

    $scope.onopen = $scope.onclose = () => angular.noop();

    $scope.isAdmin = () => {
        return $jwtAuth.isAuthenticated() && $jwtAuth.isAdmin();
    };

    $scope.openClusterConfigurationPanel = () => {
        $scope.showClusterConfigurationPanel = true;
        ClusterViewContextService.showClusterConfigurationPanel();
    };

    $scope.toggleLegend = () => {
        if ($scope.childContext.toggleLegend) {
            $scope.childContext.toggleLegend();
        }
    };

    $scope.setLoader = (loader, message) => {
        $timeout.cancel($scope.loaderTimeout);
        if (loader) {
            $scope.loaderMessage = message;
            $scope.loaderTimeout = $timeout(function () {
                $scope.loader = loader;
            }, 50);
        } else {
            $scope.loader = false;
        }
    };

    $scope.getLoaderMessage = () => {
        return $scope.loaderMessage || $translate.instant('common.loading');
    };

    $scope.getClusterConfiguration = () => {
        return ClusterRestService.getClusterConfig()
            .then((response) => {
                $scope.clusterConfiguration = response.data;
                if (!$scope.currentNode) {
                    return $scope.getCurrentNodeStatus();
                }
            })
            .catch(() => {
                $scope.clusterConfiguration = null;
            });
    };

    $scope.getClusterStatus = () => {
        return ClusterRestService.getClusterStatus()
            .then((response) => {
                const nodes = response.data.slice();
                const leader = nodes.find((node) => node.nodeState === NodeState.LEADER);

                if (isLeaderChanged($scope.currentLeader, leader)) {
                    $scope.currentLeader = leader;
                    $scope.leaderChanged = true;
                }
                $scope.currentNode = nodes.find((node) => node.address === $scope.currentNode.address);

                const links = [];
                if (leader) {
                    Object.keys(leader.syncStatus).forEach((node) => {
                        const status = leader.syncStatus[node];
                        if (status !== LinkState.NO_CONNECTION) {
                            links.push({
                                id: `${leader.address}-${node}`,
                                source: leader.address,
                                target: node,
                                status
                            });
                        }
                    });
                }
                $scope.clusterModel.hasCluster = true;
                $scope.clusterModel.nodes = nodes;
                $scope.clusterModel.links = links;
            })
            .catch((error) => {
                if (error.status === 404) {
                    $scope.clusterModel.hasCluster = false;
                    $scope.clusterModel.nodes = [];
                    $scope.clusterModel.links = [];
                    $scope.clusterConfiguration = null;
                }
            });
    };

    $scope.showCreateClusterDialog = function () {
        const modalInstance = $uibModal.open({
            templateUrl: 'js/angular/clustermanagement/templates/modal/cluster-create-dialog.html',
            controller: 'CreateClusterCtrl',
            size: 'lg',
            resolve: {
                data: function () {
                    return {
                        deleteLocation: deleteLocation,
                        clusterModel: $scope.clusterModel
                    };
                }
            }
        });

        modalInstance.result.finally(function () {
            getLocationsWithRpcAddresses();
            updateCluster(true);
        });
    };

    $scope.getCurrentNodeStatus = () => {
        return ClusterRestService.getNodeStatus()
            .then((response) => {
                $scope.leaderChanged = false;
                $scope.currentNode = response.data;
            })
            .catch((error) => {
                $scope.currentNode = error.data;
                $scope.clusterModel.hasCluster = false;
            })
            .then(() => getLocationsWithRpcAddresses());
    };

    $scope.showAddNodeToClusterDialog = () => {
        const modalInstance = $uibModal.open({
            templateUrl: 'js/angular/clustermanagement/templates/modal/add-nodes-dialog.html',
            controller: 'AddNodesDialogCtrl',
            size: 'lg',
            resolve: {
                data: function () {
                    return {
                        deleteLocation: deleteLocation,
                        clusterModel: $scope.clusterModel,
                        clusterConfiguration: $scope.clusterConfiguration
                    };
                }
            }
        });

        modalInstance.result.then((nodes) => {
            const loaderMessage = $translate.instant('cluster_management.cluster_page.add_nodes_loader');
            $scope.setLoader(true, loaderMessage);

            const nodesRpcAddress = nodes.map((node) => node.rpcAddress);
            ClusterRestService.addNodesToCluster(nodesRpcAddress)
                .then(() => {
                    const successMessage = $translate.instant(
                        'cluster_management.cluster_page.notifications.add_nodes_success');
                    onAddRemoveSuccess(successMessage);
                })
                .catch((error) => {
                    const failMessageTitle = $translate.instant('cluster_management.cluster_page.notifications.add_nodes_fail');
                    handleErrors(error.data, error.status, failMessageTitle);
                })
                .finally(() => {
                    $scope.setLoader(false);
                    updateCluster(true);
                });
        })
            .finally(() => getLocationsWithRpcAddresses());
    };

    $scope.showReplaceNodesDialog = () => {
        const modalInstance = $uibModal.open({
            templateUrl: 'js/angular/clustermanagement/templates/modal/replace-nodes-dialog.html',
            controller: 'ReplaceNodesDialogCtrl',
            size: 'lg',
            resolve: {
                data: function () {
                    return {
                        deleteLocation: deleteLocation,
                        clusterModel: $scope.clusterModel,
                        clusterConfiguration: $scope.clusterConfiguration
                    };
                }
            }
        });

        modalInstance.result.then((nodes) => {
            const loaderMessage = $translate.instant('cluster_management.cluster_page.replace_nodes_loader');
            $scope.setLoader(true, loaderMessage);

            const newNodesRpcAddress = nodes.newNodes.map((node) => node.rpcAddress);
            const oldNodesRpcAddress = nodes.oldNodes.map((node) => node.rpcAddress);
            const payload = {addNodes: newNodesRpcAddress, removeNodes: oldNodesRpcAddress};
            ClusterRestService.replaceNodesInCluster(payload)
                .then(() => {
                    const successMessage = $translate.instant(
                        'cluster_management.cluster_page.notifications.replace_nodes_success');
                    onAddRemoveSuccess(successMessage);
                })
                .catch((error) => {
                    const failMessageTitle = $translate.instant('cluster_management.cluster_page.notifications.replace_nodes_fail');
                    handleErrors(error.data, error.status, failMessageTitle);
                })
                .finally(() => {
                    $scope.setLoader(false);
                    updateCluster(true);
                });
           }).finally(() => getLocationsWithRpcAddresses());
    };

    $scope.showRemoveNodesFromClusterDialog = () => {
        const modalInstance = $uibModal.open({
            templateUrl: 'js/angular/clustermanagement/templates/modal/remove-nodes-dialog.html',
            controller: 'RemoveNodesDialogCtrl',
            size: 'lg',
            resolve: {
                data: function () {
                    return {
                        clusterModel: $scope.clusterModel
                    };
                }
            }
        });

        modalInstance.result.then(function (nodes) {
            const loaderMessage = $translate.instant('cluster_management.cluster_page.remove_nodes_loader');
            $scope.setLoader(true, loaderMessage);

            const nodesRpcAddress = nodes.map((node) => node.address);
            ClusterRestService.removeNodesFromCluster(nodesRpcAddress)
                .then(() => {
                    const successMessage = $translate.instant('cluster_management.cluster_page.notifications.remove_nodes_success');
                    onAddRemoveSuccess(successMessage);
                })
                .catch((error) => {
                    const failMessageTitle = $translate.instant('cluster_management.cluster_page.notifications.remove_nodes_fail');
                    handleErrors(error.data, error.status, failMessageTitle);
                })
                .finally(() => {
                    $scope.setLoader(false);
                    updateCluster(true);
                });
        });
    };

    // =========================
    // Private functions
    // =========================

    const selectNode = (node) => {
        if ($scope.selectedNode !== node) {
            $scope.selectedNode = node;
        } else {
            $scope.selectedNode = null;
        }
        $scope.$apply();
    };

    const updateCluster = (force) => {
        if (updateRequest) {
            return;
        }

        updateRequest = $scope.getClusterStatus()
            .then(() => {
                if (force || !$scope.clusterConfiguration) {
                    return $scope.getClusterConfiguration();
                }
            })
            .then(() => {
                if (!$scope.currentNode || $scope.leaderChanged) {
                    return $scope.getCurrentNodeStatus();
                }
            })
            .finally(() => {
                updateRequest = null;
                $scope.childContext.redraw();
            });
    };

    const deleteCluster = (forceDelete) => {
        const loaderMessage = $translate.instant('cluster_management.delete_cluster_dialog.loader_message');
        $scope.setLoader(true, loaderMessage);
        ClusterRestService.deleteCluster(forceDelete)
            .then((response) => {
                const allNodesDeleted = Object.values(response.data).every((resultMsg) => resultMsg === DELETED_ON_NODE_MESSAGE);
                if (allNodesDeleted) {
                    const successMessage = $translate.instant('cluster_management.delete_cluster_dialog.notifications.success_delete');
                    toastr.success(successMessage);
                } else {
                    const successMessage = $translate.instant(
                        'cluster_management.delete_cluster_dialog.notifications.success_delete_partial');
                    const failedNodesList = Object.keys(response.data)
                        .reduce((message, key) => message += `<div>${key} - ${response.data[key]}</div>`, '');
                    toastr.warning(failedNodesList, successMessage, {allowHtml: true});
                }
                $scope.getClusterConfiguration();
            })
            .catch((error) => {
                const failMessage = $translate.instant('cluster_management.delete_cluster_dialog.notifications.fail_delete');
                handleErrors(error.data, error.status, failMessage);
            })
            .finally(() => {
                $scope.setLoader(false);
                updateCluster(true);
                $rootScope.$broadcast('reloadLocations');
            });
    };

    const isLeaderChanged = (currentLeader, newLeader) => {
        if (!newLeader) {
            // If election is in place and there is no leader yet, consider it as leader change
            return true;
        }
        return !currentLeader || currentLeader.address !== newLeader.address;
    };

    const getLocationsWithRpcAddresses = () => {
        return RemoteLocationsService.getLocationsWithRpcAddresses()
            .then((locations) => {
                const localNode = locations.find((location) => location.isLocal);
                if (localNode) {
                    localNode.endpoint = $scope.currentNode.endpoint;
                    localNode.rpcAddress = $scope.currentNode.address;
                }
                $scope.clusterModel.locations = locations;
            });
    };

    // Delete location
    const deleteLocation = (location) => {
        return ModalService.openSimpleModal({
            title: $translate.instant('location.confirm.detach'),
            message: $translate.instant('location.confirm.detach.warning', {uri: location.endpoint}),
            warning: true
        }).result.then(() => $repositories.deleteLocation(location.endpoint));
    };

    const onAddRemoveSuccess = (message) => {
        toastr.success(message);
        $scope.getClusterConfiguration();
    };

    const handleErrors = (data, status, title) => {
        let failMessage = data.message || data;

        if (status === 400 && Array.isArray(data)) {
            failMessage = data.reduce((acc, error) => acc += `<div>${error}</div>`, '');
        } else if (status === 412 && !isString(data)) {
            failMessage = Object.keys(data)
                .reduce((message, key) => message += `<div>${key} - ${data[key]}</div>`, '');
        }
        toastr.error(failMessage, title, {allowHtml: true});
    };

    const loadInitialData = () => {
        $scope.loader = true;

        return $scope.getCurrentNodeStatus()
            .then(() => {
                return $scope.getClusterConfiguration();
            })
            .then(() => {
                return $scope.getClusterStatus();
            })
            .finally(() => {
                $scope.setLoader(false);
            });
    };

    const resizeHandler = () => {
        $scope.childContext.resize();
    };

    const mousedownHandler = function (event) {
        const target = event.target;
        const nodeTooltipElement = document.getElementById('nodeTooltip');
        if ($scope.selectedNode && nodeTooltipElement !== target && !nodeTooltipElement.contains(target)) {
            $scope.childContext.selectNode(null);
        }
    };

    // =========================
    // Events and watchers
    // =========================

    const subscriptions = [];

    const removeAllListeners = () => {
        subscriptions.forEach((subscription) => subscription());
    };

    const subscribeHandlers = () => {
        // track window resizing and window mousedown
        w.bind('resize', resizeHandler);
        w.bind('mousedown', mousedownHandler);

        subscriptions.push(ClusterViewContextService.onShowClusterConfigurationPanel((show) => {
            $scope.showClusterConfigurationPanel = show;
        }));
        subscriptions.push($scope.$on(UPDATE_CLUSTER, (event, data) => {
            updateCluster(data.force);
        }));
        subscriptions.push($scope.$on(DELETE_CLUSTER, (event, data) => {
            deleteCluster(data.force);
        }));
    };

    $scope.$on('$destroy', function () {
        w.unbind('resize', resizeHandler);
        w.unbind('mousedown', mousedownHandler);
        removeAllListeners();
    });

    // =========================
    // Initialization
    // =========================

    const init = () => {
        subscribeHandlers();
        $scope.childContext.selectNode = selectNode;
        $scope.showClusterConfigurationPanel = ClusterViewContextService.getShowClusterConfigurationPanel();

        loadInitialData()
            .finally(() => {
                const timer = $interval(function () {
                    updateCluster();
                }, 1000);

                $scope.$on("$destroy", function () {
                    $interval.cancel(timer);
                });
            });
    };
    init();
}
