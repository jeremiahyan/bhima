angular.module('bhima.controllers')
  .controller('UsersDepotManagementController', UsersDepotManagementController);

UsersDepotManagementController.$inject = [
  '$state', 'UserService',
  'NotifyService', 'appcache', 'DepotService', 'FormatTreeDataService', 'params',
];

function UsersDepotManagementController($state, Users, Notify, AppCache, Depots, FormatTreeData, params) {
  const vm = this;
  const cache = AppCache('UserDepot');

  if (params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  // the user object that is either edited or created
  vm.user = {};
  vm.depots = [];
  vm.setNodeValue = setNodeValue;
  vm.setAllNodeValue = setAllNodeValue;

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;

  vm.onDepotChange = (depots) => {
    vm.user.depots = depots;
  };

  function setNodeValue(childrens, depot) {
    childrens.forEach(child => {
      vm.depotsData.forEach(d => {
        if (child.uuid === d.uuid) {
          d._checked = depot._checked;
        }
      });
      // Set Children
      if (child.children.length) {
        setNodeValue(child.children, child);
      }
    });
  }

  function setAllNodeValue(depots, allStatus) {
    depots.forEach(depot => {
      depot._checked = allStatus;
    });
  }

  // submit the data to the server from all two forms (update, create)
  function submit(userForm) {
    const filterChecked = vm.depotsData.filter((item) => {
      return item._checked;
    });

    const userDepots = filterChecked.map(depot => depot.uuid);

    if (userForm.$invalid || !vm.user.id) { return 0; }
    return Users.updateDepots(vm.user.id, userDepots || [])
      .then(() => {
        Notify.success('USERS.UPDATED');
        $state.go('users.list', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  Users.depots(vm.stateParams.id)
    .then((depots) => {
      vm.depotsUser = depots;
      return Depots.read();
    })
    .then(data => {
      data.map(item => {
        item.id = item.uuid;
        item.key = item.text;
        item._checked = false;

        if (item.parent === '0') {
          item.parent = 0;
        }

        if (vm.depotsUser.length) {
          vm.depotsUser.forEach(depotUuid => {
            if (item.uuid === depotUuid) {
              item._checked = true;
            }
          });
        }
        return item;
      });

      vm.depotsData = FormatTreeData.formatStore(data);
    })
    .catch(Notify.handleError);

  Users.read(vm.stateParams.id)
    .then((user) => {
      vm.user = user;
    })
    .catch(Notify.handleError);

  function closeModal() {
    $state.go('users.list');
  }
}
