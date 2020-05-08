angular.module('bhima.controllers')
  .controller('StockFindPurchaseModalController', StockFindPurchaseModalController);

StockFindPurchaseModalController.$inject = [
  '$uibModalInstance', 'PurchaseOrderService', 'NotifyService',
  'uiGridConstants', 'GridFilteringService', 'ReceiptModal',
  'bhConstants',
];

function StockFindPurchaseModalController(
  Instance, Purchase, Notify,
  uiGridConstants, Filtering, Receipts, bhConstants,
) {
  const vm = this;

  // global
  vm.selectedRow = {};

  /* ======================= Grid configurations ============================ */
  vm.filterEnabled = false;
  vm.gridOptions = { appScopeProvider : vm };

  const filtering = new Filtering(vm.gridOptions);

  const columns = [
    {
      field            : 'reference',
      displayName      : 'TABLE.COLUMNS.REFERENCE',
      headerCellFilter : 'translate',
      cellTemplate     : 'modules/stock/entry/modals/templates/purchase_reference.tmpl.html',
    },

    {
      field            : 'date',
      cellFilter       : 'date:"'.concat(bhConstants.dates.format, '"'),
      filter           : { condition : filtering.filterByDate },
      displayName      : 'TABLE.COLUMNS.DATE',
      headerCellFilter : 'translate',
      sort             : { priority : 0, direction : 'desc' },
    },

    {
      field            : 'supplier',
      displayName      : 'FORM.LABELS.SUPPLIER',
      headerCellFilter : 'translate',
    },

    {
      field            : 'cost',
      displayName      : 'STOCK.AMOUNT',
      headerCellFilter : 'translate',
      cellFilter       : 'currency: grid.appScope.enterprise.currency_id',
      cellClass        : 'text-right',
    },

    { field : 'author', displayName : 'TABLE.COLUMNS.BY', headerCellFilter : 'translate' },
  ];

  vm.gridOptions.columnDefs = columns;
  vm.gridOptions.multiSelect = false;
  vm.gridOptions.enableFiltering = vm.filterEnabled;
  vm.gridOptions.onRegisterApi = onRegisterApi;
  vm.toggleFilter = toggleFilter;

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  vm.showReceipt = showReceipt;

  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
    vm.gridApi.selection.on.rowSelectionChanged(null, rowSelectionCallback);
  }

  function rowSelectionCallback(row) {
    vm.selectedRow = row.entity;
  }

  /** toggle filter */
  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /** get purchase document */
  function showReceipt(uuid) {
    Receipts.purchase(uuid);
  }

  /* ======================= End Grid ======================================== */
  function load() {
    vm.loading = true;
    Purchase.search({ detailed : 1, status_id : [2, 4] })
      .then(purchases => {
        vm.gridOptions.data = purchases;
      })
      .catch(() => {
        vm.hasError = true;
      })
      .finally(() => {
        vm.loading = false;
      });
  }

  // submit
  function submit() {
    if (!vm.selectedRow || (vm.selectedRow && !vm.selectedRow.uuid)) { return null; }

    return Purchase.stockBalance(vm.selectedRow.uuid)
      .then(handlePurchaseInformation)
      .catch(Notify.handleError);
  }

  // display the supplier name
  function handlePurchaseInformation(purchases) {
    purchases.forEach(purchase => {
      purchase.display_name = purchase.supplier_name;
    });
    Instance.close(purchases);
  }

  // cancel
  function cancel() {
    Instance.close();
  }

  load();
}
