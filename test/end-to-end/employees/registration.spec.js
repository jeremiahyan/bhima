/* global browser */
const chai = require('chai');
const helpers = require('../shared/helpers');

const { expect } = chai;
const RegistrationPage = require('./registration.page.js');

helpers.configure(chai);

describe('Employees', () => {
  const path = '#!/employees/register';
  const registrationPage = new RegistrationPage();
  const employee = {
    code          : 'HBB80',
    display_name  : 'Dedrick Kitamuka',
    sex          : 'M',
    dob           : '30/06/1960',
    date_embauche : '17/05/1997',
    nb_enfant     : 2,
    bank          : 'BIAC',
    bank_account  : '00-99-88-77',
    email         : 'me@info.com',
    adresse       : '221B Baker Street',
    hospital_no   : 'TP003',
    payroll       : {
      TPR : 20,
      f_scol : 150,
    },
  };

  before(() => helpers.navigate(path));

  it('blocks invalid form submission with relevant error classes', () => {
    // verify we are in the current path
    expect(helpers.getCurrentPath()).to.eventually.equal(path);

    registrationPage.createEmployee();
    registrationPage.requiredFieldErrored();
    registrationPage.noRequiredFieldOk();
  });

  it('creates a new employee', () => {
    registrationPage.setDisplayName(employee.display_name);
    registrationPage.setDob(employee.dob);
    registrationPage.setSex(employee.sex);
    registrationPage.setCode(employee.code);
    registrationPage.setGrade('A1');
    registrationPage.setHospitalNumber(employee.hospital_no);
    registrationPage.setCreditorGroup('Employees');
    registrationPage.setDebtorGroup('NGO IMA World Health');
    registrationPage.setOriginLocation(helpers.data.locations);
    registrationPage.setCurrentLocation(helpers.data.locations);
    registrationPage.setHiringDate(employee.date_embauche);
    registrationPage.setNumberChild(employee.nb_enfant);
    registrationPage.setService('Administration');
    registrationPage.setFonction('Infirmier');
    registrationPage.setIsMedical();
    registrationPage.setEmail(employee.email);
    registrationPage.setAddress(employee.adresse);
    registrationPage.setBank(employee.bank);
    registrationPage.setBankAccount(employee.bank_account);
    registrationPage.setRubricPayroll(employee.payroll);

    registrationPage.createEmployee();
    registrationPage.isEmpoyeeCreated(true);
    browser.refresh();
  });

  // FIXME: skip throws an error
  // it.skip('edits an employee', () => {
  //   element(by.id(`employee-upd-${employeeId}`)).click();

  //   // modify the employee display_name
  //   FU.input('EmployeeCtrl.employee.display_name', ' Elementary');
  //   FU.input('EmployeeCtrl.employee.adresse', ' Blvd Lumumba');

  //   element(by.id('bhima-employee-locked')).click();
  //   element(by.id('change_employee')).click();

  //   // make sure the success message appears
  //   components.notification.hasSuccess();
  // });

  // it.skip('unlocks an employee', () => {
  //   element(by.id(`employee-upd-${employeeId}`)).click();
  //   element(by.id('bhima-employee-locked')).click();
  //   element(by.id('change_employee')).click();

  //   // make sure the success message appears
  //   components.notification.hasSuccess();
  // });
});
