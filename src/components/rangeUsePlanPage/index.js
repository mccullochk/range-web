import React, { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Icon, Modal, Header, Button } from 'semantic-ui-react'
import { Route } from 'react-router-dom'
import { Loading, PrimaryButton } from '../common'
import {
  planUpdated,
  pastureAdded,
  pastureUpdated,
  pastureCopied,
  grazingScheduleUpdated,
  openConfirmationModal
} from '../../actions'
import {
  isUserAgreementHolder,
  isUserAdmin,
  isUserRangeOfficer,
  axios,
  getAuthHeaderConfig
} from '../../utils'
import { appendUsage } from '../../utils/helper/plan'
import * as selectors from '../../reducers/rootReducer'
import PageForStaff from './pageForStaff'
import PageForAH from './pageForAH'
import {
  fetchRUP,
  updateRUP,
  updateRUPStatus,
  createOrUpdateRUPPasture,
  createOrUpdateRUPGrazingSchedule,
  toastSuccessMessage,
  toastErrorMessage,
  createAmendment,
  createOrUpdateRUPMinisterIssueAndActions,
  createOrUpdateRUPInvasivePlantChecklist,
  createOrUpdateRUPManagementConsideration
} from '../../actionCreators'
import * as API from '../../constants/api'
import { Form } from 'formik-semantic-ui'
import { useToast } from '../../providers/ToastProvider'
import { useReferences } from '../../providers/ReferencesProvider'
import RUPSchema from './schema'
import OnSubmitValidationError from '../common/form/OnSubmitValidationError'
import {
  saveGrazingSchedules,
  saveInvasivePlantChecklist,
  saveManagementConsiderations,
  saveAdditionalRequirements,
  saveMinisterIssues,
  getPlan,
  savePastures,
  savePlantCommunities,
  createVersion
} from '../../api'
import PDFView from './pdf/PDFView'

const Base = ({
  user,
  plansMap,
  history,
  fetchRUP,
  match,
  location,
  ...props
}) => {
  const [isFetchingPlan, setFetching] = useState(false)
  const [errorFetchingPlan, setError] = useState()
  const [plan, setPlan] = useState()

  const references = useReferences()

  const { successToast, errorToast } = useToast()

  const getPlanId = () =>
    match.params.planId || location.pathname.charAt('/range-use-plan/'.length)

  const fetchPlan = async () => {
    setFetching(true)
    const planId = getPlanId()

    try {
      const tempPlan = await getPlan(planId)
      const plan = appendUsage(tempPlan)
      setPlan(RUPSchema.cast(plan))
    } catch (e) {
      setError(e)
    }

    setFetching(false)

    return fetchRUP(planId)
  }

  useEffect(() => {
    fetchPlan()
  }, [])

  const handleValidationError = () => {
    errorToast('Could not submit due to invalid fields.')
  }

  const handleSubmit = async (plan, formik) => {
    const {
      pastures,
      grazingSchedules,
      invasivePlantChecklist,
      managementConsiderations,
      ministerIssues,
      additionalRequirements
    } = RUPSchema.cast(plan)

    const config = getAuthHeaderConfig()

    try {
      // Update Plan
      await axios.put(API.UPDATE_RUP(plan.id), plan, config)

      const newPastures = await savePastures(plan.id, pastures)

      await Promise.all(
        newPastures.map(async pasture => {
          await savePlantCommunities(
            plan.id,
            pasture.id,
            pasture.plantCommunities
          )
        })
      )

      await saveGrazingSchedules(plan.id, grazingSchedules)
      await saveInvasivePlantChecklist(plan.id, invasivePlantChecklist)
      await saveManagementConsiderations(plan.id, managementConsiderations)
      await saveMinisterIssues(plan.id, ministerIssues, newPastures)
      await saveAdditionalRequirements(plan.id, additionalRequirements)

      await createVersion(plan.id)

      formik.setSubmitting(false)
      successToast('Successfully saved draft')

      fetchPlan()
    } catch (err) {
      formik.setStatus('error')
      formik.setSubmitting(false)
      errorToast('Error saving draft')
      throw err
    }
  }

  const agreement = plan && plan.agreement
  const isFetchingPlanForTheFirstTime = !plan && isFetchingPlan
  // const doneFetching = !isFetchingPlanForTheFirstTime;

  if (errorFetchingPlan) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(errorFetchingPlan)
    }
    return (
      <div className="rup__fetching-error">
        <Icon name="warning sign" size="large" color="red" />
        <div>
          <span className="rup__fetching-error__message">
            Error occurred while fetching the range use plan.
          </span>
        </div>
        {process.env.NODE_ENV !== 'production' && (
          <p>Check console for details.</p>
        )}
        <div>
          <PrimaryButton inverted onClick={history.goBack}>
            Go Back
          </PrimaryButton>
          <span className="rup__fetching-error__or-message">or</span>
          <PrimaryButton onClick={fetchPlan} content="Retry" />
        </div>
      </div>
    )
  }

  return (
    <Fragment>
      <Loading active={isFetchingPlanForTheFirstTime} onlySpinner />

      {!plan && !isFetchingPlan && (
        <div className="rup__no-plan-shown">
          {"Don't see any plan?"}
          <PrimaryButton
            onClick={fetchPlan}
            content="Fetch Plan"
            style={{ marginLeft: '15px' }}
          />
        </div>
      )}

      <Route
        path={`${match.url}/export-pdf`}
        render={() => {
          const closePDFModal = () => history.push(match.url)
          return (
            <Modal
              size="tiny"
              open={true}
              onClose={closePDFModal}
              dimmer="blurring">
              <Header content="Download PDF" icon="file pdf" />
              <Modal.Content>
                The PDF may take a few minutes to generate.
              </Modal.Content>
              <Modal.Actions>
                <Button type="button" onClick={closePDFModal}>
                  Close
                </Button>
                <PDFView match={match} />
              </Modal.Actions>
            </Modal>
          )
        }}
      />

      {plan && (
        <Form
          initialValues={plan}
          enableReinitialize
          validateOnChange={true}
          validationSchema={RUPSchema}
          onSubmit={handleSubmit}
          render={({ values: plan }) => (
            <>
              <OnSubmitValidationError callback={handleValidationError} />

              {(isUserAdmin(user) || isUserRangeOfficer(user)) && (
                <PageForStaff
                  references={references}
                  agreement={agreement}
                  plan={plan}
                  fetchPlan={fetchPlan}
                  user={user}
                  history={history}
                  {...props}
                />
              )}

              {isUserAgreementHolder(user) && (
                <PageForAH
                  references={references}
                  agreement={agreement}
                  plan={plan}
                  fetchPlan={fetchPlan}
                  user={user}
                  history={history}
                  {...props}
                />
              )}
            </>
          )}
        />
      )}
    </Fragment>
  )
}

Base.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({ planId: PropTypes.string })
  }).isRequired,
  user: PropTypes.shape({}).isRequired,
  history: PropTypes.shape({}).isRequired,
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
  fetchRUP: PropTypes.func.isRequired,
  isFetchingPlan: PropTypes.bool.isRequired,
  errorFetchingPlan: PropTypes.bool.isRequired,
  plansMap: PropTypes.shape({}).isRequired,
  reAuthRequired: PropTypes.bool.isRequired
}

const mapStateToProps = state => ({
  plansMap: selectors.getPlansMap(state),
  pasturesMap: selectors.getPasturesMap(state),
  grazingSchedulesMap: selectors.getGrazingSchedulesMap(state),
  ministerIssuesMap: selectors.getMinisterIssuesMap(state),
  planStatusHistoryMap: selectors.getPlanStatusHistoryMap(state),
  additionalRequirementsMap: selectors.getAdditionalRequirementsMap(state),
  managementConsiderationsMap: selectors.getManagementConsiderationsMap(state),
  isFetchingPlan: selectors.getIsFetchingPlan(state),
  errorFetchingPlan: selectors.getPlanErrorOccured(state),
  references: selectors.getReferences(state),
  isUpdatingStatus: selectors.getIsUpdatingPlanStatus(state),
  isCreatingAmendment: selectors.getIsCreatingAmendment(state),
  reAuthRequired: selectors.getReAuthRequired(state)
})

export default connect(
  mapStateToProps,
  {
    fetchRUP,
    updateRUP,
    updateRUPStatus,
    planUpdated,
    pastureAdded,
    pastureUpdated,
    pastureCopied,
    createOrUpdateRUPPasture,
    grazingScheduleUpdated,
    createOrUpdateRUPGrazingSchedule,
    toastSuccessMessage,
    toastErrorMessage,
    createAmendment,
    openConfirmationModal,
    createOrUpdateRUPMinisterIssueAndActions,
    createOrUpdateRUPInvasivePlantChecklist,
    createOrUpdateRUPManagementConsideration
  }
)(Base)
