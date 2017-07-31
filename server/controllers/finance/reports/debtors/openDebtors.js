/**
 * @overview finance/reports/debtors/open.js
 *
 * @description
 * This report concerns the debtors that have open balances
 * The typical age categories are 0-30 days, 30-60 days, 60-90 days, and > 90
 * days.
 *
 * As usual, the reports are created with a handlebars template and shipped to
 * the client as either JSON, HTML, or PDF, depending on the renderer specified
 * in the HTTP query string.
 */

const _ = require('lodash');
const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');

// path to the template to render
const TEMPLATE = './server/controllers/finance/reports/debtors/openDebtors.handlebars';

/**
 * Actually builds the open debtor report.
 */
function build(req, res, next) {
  const qs = _.extend(req.query, { csvKey : 'debtors' });
  const metadata = _.clone(req.session);

  let report;

  try {
    report = new ReportManager(TEMPLATE, metadata, qs);
  } catch (e) {
    return next(e);
  }
   
  // If any query values are not passed from the client, default values will be used
  return requestOpenDebtors(req.query)
    .then((openDebtorsContext) => { 
      return report.render(openDebtorsContext);
    })
    .then((compiledReport) => { 
      res.set(compiledReport.headers).send(compiledReport.report);
    })
    .catch(next)
    .done();
}

// @TODO If unverifiedSource will continue to be used the where conditions should be put on each indivudual select 
//       MySQL is not able to optimise indexed columns from a generic SELECT
function requestOpenDebtors(params) { 
  const verifiedSource = 'general_ledger';

  const showDetailedView = params.showDetailedView || false;
  const showUnverifiedTransactions = params.showUnverifiedTransactions || false;
  const limitDate = params.limitDate || false;
  const reportDateLimit = params.reportDateLimit;
  const ordering = parseOrdering(params.order);

  const unverifiedSource = `
    (SELECT entity_uuid, reference_uuid, trans_date, credit_equiv, debit_equiv from general_ledger
      UNION 
     SELECT entity_uuid, reference_uuid, trans_date, credit_equiv, debit_equiv from posting_journal) as source
  `;

  const source = showUnverifiedTransactions ? unverfiedSource : verifiedSource;

  // ONLY show transactions after a certain date (just show this week for example) 
  const dateCondition = limitDate ? `AND DATE(trans_date) > DATE(${reportDateLimit})` : '';
  
  const debtorQuery = buildDebtQuery(showDetailedView, source, dateCondition);
  
  const aggregateQuery = `
    SELECT COUNT(DISTINCT(entity_uuid)) as numDebtors, SUM(debit_equiv - credit_equiv) as balance
    FROM ${source}
    WHERE entity_uuid IS NOT NULL 
    ${dateCondition}
    AND (debit_equiv - credit_equiv) > 0  
  `;
  
  const debtorReport = { 
    details : {
      showDetailedView, 
      limitDate, 
      reportDateLimit
    }
  };

  return db.exec(debtorQuery)
    .then((debtorsDebts) => { 
      debtorReport.debtors = debtorsDebts;
      return db.one(aggregateQuery);
    })
    .then((aggregateDebts) => { 
      debtorReport.aggregates = aggregateDebts;
      return debtorReport;
    });
}

// ONLY select rows with an entity
// ONLY show debtors with a debt above 0
function buildDebtQuery(showDetailedView, source, dateCondition) { 
    
  // Include complex parameters depending on detailed view Boolean requirements
  const complexParameters = showDetailedView ? ', MAX(invoice.date) as latestInvoiceDate, MAX(cash.date) as latestCashDate ' : '';
  const complexJoin = showDetailedView ? 'LEFT JOIN invoice on reference_uuid = invoice.uuid LEFT JOIN cash on reference_uuid = cash.uuid ' : '';

  // Include all balance and debtor information by default
  const query = ` 
    SELECT patient.display_name, entity_map.text as reference, SUM(debit_equiv - credit_equiv) as balance ${complexParameters}
    FROM ${source} 
    JOIN patient on entity_uuid = patient.debtor_uuid
    LEFT JOIN entity_map on entity_map.uuid = entity_uuid
    ${complexJoin}
    WHERE entity_uuid IS NOT NULL
    ${dateCondition}
    GROUP BY entity_uuid
    HAVING SUM(debit_equiv - credit_equiv) > 0
    ORDER by SUM(debit_equiv - credit_equiv)
  `;
  return query;
}

function parseOrdering(orderParameter) { 
  let ordering;
  switch (orderParameter) {
  case 'payment-date-asc':
    ordering = 'lastPaymentDate ASC';
    break;

  case 'payment-date-desc':
    ordering = 'lastPaymentDate DESC';
    break;

  case 'invoice-date-asc':
    ordering = 'lastInvoiceDate ASC';
    break;

  case 'invoice-date-desc':
    ordering = 'lastInvoiceDate DESC';
    break;

  case 'debt-desc':
    ordering = 'ledger.balance DESC';
    break;

  case 'patient-name-desc':
    ordering = 'patient.display_name DESC';
    break;

  case 'patient-name-asc':
    ordering = 'patient.display_name ASC';
    break;

  case 'debt-asc':
    ordering = 'ledger.balance ASC';
    break;

  default:
    ordering = 'cash.date ASC';
    break;
  }
  return ordering;
}

exports.report = build;
