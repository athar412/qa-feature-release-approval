import { setElementStyle, deleteTableRow, deleteRevisionRow } from './dom-utils.js';
import { toggleTheme, updateThemeToggleIcon, initTheme } from './theme.js';
import { addRtmRow, addRiskRow, addDefectRow, addEvidenceCard, addTestCaseRow, deleteTestCaseRow, addKnownIssueRow, deleteKnownIssueRow, addRevisionRow } from './tables.js';
import { importRtmExcel, importDefectExcel } from './import-excel.js';
import { calculatePassRate, updateMetricsFromRtm, updateStatusBanners } from './metrics.js';
import { openSignatureModal, clearSignatureCanvas, closeSignatureModal, applySignature } from './signature.js';
import { previewFlowchart, previewEvidence } from './upload.js';
import { processLogin, logoutUser, checkAuth, handleAuthClick, applyAuthUI, setGeneralEditable, setKnownIssuesEditable, setAddButtonsVisible } from './auth.js';
import { toggleSharePopover, executeShareCopy, copyShareUrlDirect, shareDocumentLink } from './share.js';
import { loadHistoryDocument, renderHistoryPopoverList, closeHistoryModal, openHistoryModal, renderHistoryTable } from './history.js';
import { updateAutoDocNumber, bakeSelectedOptions, getFormState, resetCurrentForm, clearAllLocalStorageData, saveDocument, saveDocumentToCloud, loadDocumentFromCloud, saveDocumentSilently, loadDocument, renderLoadedDoc, approveDocumentAction, rejectDocumentAction, approveRelease, rejectRelease, deleteDocumentAction } from './document-store.js';
import { renderHomeDashboard, filterHomeDocsList, fetchAllDocumentsForHome, openDocumentFromHome } from './dashboard.js';
import { syncSelectPrintValues } from './print.js';
import { toggleMobileMenu, showHomeView, showFormView, createNewDocument, scrollToDocumentsList } from './navigation.js';

Object.assign(window, {
  setElementStyle,
  deleteTableRow,
  deleteRevisionRow,
  toggleTheme,
  updateThemeToggleIcon,
  initTheme,
  addRtmRow,
  addRiskRow,
  addDefectRow,
  addEvidenceCard,
  addTestCaseRow,
  deleteTestCaseRow,
  addKnownIssueRow,
  deleteKnownIssueRow,
  addRevisionRow,
  importRtmExcel,
  importDefectExcel,
  calculatePassRate,
  updateMetricsFromRtm,
  updateStatusBanners,
  openSignatureModal,
  clearSignatureCanvas,
  closeSignatureModal,
  applySignature,
  previewFlowchart,
  previewEvidence,
  processLogin,
  logoutUser,
  checkAuth,
  handleAuthClick,
  applyAuthUI,
  setGeneralEditable,
  setKnownIssuesEditable,
  setAddButtonsVisible,
  toggleSharePopover,
  executeShareCopy,
  copyShareUrlDirect,
  shareDocumentLink,
  loadHistoryDocument,
  renderHistoryPopoverList,
  closeHistoryModal,
  openHistoryModal,
  renderHistoryTable,
  updateAutoDocNumber,
  bakeSelectedOptions,
  getFormState,
  resetCurrentForm,
  clearAllLocalStorageData,
  saveDocument,
  saveDocumentToCloud,
  loadDocumentFromCloud,
  saveDocumentSilently,
  loadDocument,
  renderLoadedDoc,
  approveDocumentAction,
  rejectDocumentAction,
  approveRelease,
  rejectRelease,
  deleteDocumentAction,
  renderHomeDashboard,
  filterHomeDocsList,
  fetchAllDocumentsForHome,
  openDocumentFromHome,
  syncSelectPrintValues,
  toggleMobileMenu,
  showHomeView,
  showFormView,
  createNewDocument,
  scrollToDocumentsList,
});
console.log('Globals initialized');
