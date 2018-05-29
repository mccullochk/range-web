import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'semantic-ui-react';
import cloneDeep from 'lodash.clonedeep';
import { Status, ConfirmationModal, Banner } from '../common';
import RupBasicInformation from './view/RupBasicInformation';
import RupPastures from './view/RupPastures';
import RupSchedules from './view/RupSchedules';
import EditRupSchedules from './edit/EditRupSchedules';
import { DRAFT, PENDING, RUP_STICKY_HEADER_ELEMENT_ID } from '../../constants/variables';
import { validateRangeUsePlan } from '../../handlers/validation';
import {
  SAVE_PLAN_AS_DRAFT_SUCCESS,
  SUBMIT_PLAN_SUCCESS,
  SUBMIT_RUP_CHANGE_FOR_AH_HEADER,
  SUBMIT_RUP_CHANGE_FOR_AH_CONTENT,
} from '../../constants/strings';
import PlanStatus from '../../models/PlanStatus';

const propTypes = {
  user: PropTypes.shape({}).isRequired,
  agreement: PropTypes.shape({ plan: PropTypes.object }).isRequired,
  livestockTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  statuses: PropTypes.arrayOf(PropTypes.object).isRequired,
  createOrUpdateRupSchedule: PropTypes.func.isRequired,
  updateRupStatus: PropTypes.func.isRequired,
  toastErrorMessage: PropTypes.func.isRequired,
  toastSuccessMessage: PropTypes.func.isRequired,
};

export class RupAH extends Component {
  constructor(props) {
    super(props);

    // store fields that can be updated within this page
    const { plan } = props.agreement;
    const { status } = plan || {};

    this.state = {
      plan,
      status,
      isSubmitModalOpen: false,
    };
  }

  componentDidMount() {
    this.stickyHeader = document.getElementById(RUP_STICKY_HEADER_ELEMENT_ID);
    // requires the absolute offsetTop value
    this.stickyHeaderOffsetTop = this.stickyHeader.offsetTop;
    this.scrollListner = window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.scrollListner);
  }

  onSaveDraftClick = () => {
    const {
      statuses,
      toastSuccessMessage,
    } = this.props;
    const { plan } = this.state;
    const status = statuses.find(s => s.name === DRAFT);

    const errors = validateRangeUsePlan(plan);
    // errors are found
    if (errors.length !== 0) {
      const [error] = errors;
      document.getElementById(error.elementId).scrollIntoView({
        behavior: 'smooth',
      });
    } else { // no errors, start making network calls
      this.setState({ isSavingAsDraft: true });

      const onUpdated = (newSchedules) => {
        // update schedules in the state
        plan.grazingSchedules = newSchedules;
        toastSuccessMessage(SAVE_PLAN_AS_DRAFT_SUCCESS);
        this.setState({
          isSavingAsDraft: false,
          status,
          plan,
        });
      };
      const onFailed = () => {
        this.setState({
          isSavingAsDraft: false,
        });
      };
      this.updateRupStatusAndContent(plan, status, onUpdated, onFailed);
    }
  }

  onSubmitClicked = () => {
    const {
      statuses,
      toastSuccessMessage,
    } = this.props;

    const { plan } = this.state;
    const status = statuses.find(s => s.name === PENDING);
    const errors = validateRangeUsePlan(plan);

    // errors are found
    if (errors.length !== 0) {
      const [error] = errors;
      document.getElementById(error.elementId).scrollIntoView({
        behavior: 'smooth',
      });
    } else { // no errors, start making network calls
      this.setState({ isSubmitting: true });

      const onUpdated = (newSchedules) => {
        // update schedules in the state
        plan.grazingSchedules = newSchedules;
        toastSuccessMessage(SUBMIT_PLAN_SUCCESS);
        this.setState({
          isSubmitting: false,
          isSubmitModalOpen: false,
          status,
          plan,
        });
      };
      const onFailed = () => {
        this.setState({
          isSubmitting: false,
          isSubmitModalOpen: false,
        });
      };
      this.updateRupStatusAndContent(plan, status, onUpdated, onFailed);
    }
  }

  closeSubmitConfirmModal = () => this.setState({ isSubmitModalOpen: false })
  openSubmitConfirmModal = () => this.setState({ isSubmitModalOpen: true })

  updateRupStatusAndContent = (plan, status, onSuccess, onFailed) => {
    const {
      createOrUpdateRupSchedule,
      updateRupStatus,
      toastErrorMessage,
    } = this.props;

    const planId = plan && plan.id;
    const statusId = status && status.id;
    const grazingSchedules = plan && plan.grazingSchedules;

    if (planId && statusId && grazingSchedules) {
      const makeRequest = async () => {
        try {
          await updateRupStatus({ planId, statusId }, false);
          const newSchedules = await Promise.all(grazingSchedules.map(schedule => (
            createOrUpdateRupSchedule(planId, schedule)
          )));
          onSuccess(newSchedules);
        } catch (err) {
          onFailed();
          toastErrorMessage(err);
          throw err;
        }
      };
      makeRequest();
    }
  }

  handleScroll = () => {
    if (this.stickyHeader) {
      if (window.pageYOffset >= this.stickyHeaderOffsetTop) {
        this.stickyHeader.classList.add('rup__sticky--fixed');
      } else {
        this.stickyHeader.classList.remove('rup__sticky--fixed');
      }
    }
  }

  handleSchedulesChange = (schedules) => {
    const plan = cloneDeep(this.state.plan);
    plan.grazingSchedules = schedules;
    this.setState({
      plan,
    });
  }

  renderSchedules = (plan, usage = [], status, livestockTypes = [], isEditable) => {
    if (isEditable) {
      return (
        <EditRupSchedules
          className="rup__edit-schedules"
          livestockTypes={livestockTypes}
          plan={plan}
          usage={usage}
          handleSchedulesChange={this.handleSchedulesChange}
        />
      );
    }
    return (
      <RupSchedules
        className="rup__schedules"
        livestockTypes={livestockTypes}
        usage={usage}
        plan={plan}
        status={status}
      />
    );
  }

  render() {
    const {
      plan,
      status: s,
      isSavingAsDraft,
      isSubmitting,
      isSubmitModalOpen,
    } = this.state;

    const {
      user,
      agreement,
      livestockTypes,
    } = this.props;

    const status = new PlanStatus(s);
    const isEditable = status.isCreated || status.isInDraft || status.isChangedRequested;

    const agreementId = agreement && agreement.id;
    const zone = agreement && agreement.zone;
    const usage = agreement && agreement.usage;

    const rupSchedules = this.renderSchedules(plan, usage, status, livestockTypes, isEditable);

    return (
      <div className="rup">
        <ConfirmationModal
          open={isSubmitModalOpen}
          header={SUBMIT_RUP_CHANGE_FOR_AH_HEADER}
          content={SUBMIT_RUP_CHANGE_FOR_AH_CONTENT}
          onNoClicked={this.closeSubmitConfirmModal}
          onYesClicked={this.onSubmitClicked}
          loading={isSubmitting}
        />

        <Banner
          className="banner__edit-rup"
          header={agreementId}
          content={status && status.bannerContentForAH}
        />

        <div
          id={RUP_STICKY_HEADER_ELEMENT_ID}
          className="rup__sticky"
        >
          <div className="rup__sticky__container">
            <div className="rup__sticky__left">
              <div className="rup__sticky__title">{agreementId}</div>
              <Status
                className="rup__status"
                status={status}
                user={user}
              />
            </div>
            <div className="rup__sticky__btns">
              <Button
                loading={isSavingAsDraft}
                disabled={!isEditable}
                onClick={this.onSaveDraftClick}
              >
                Save Draft
              </Button>
              <Button
                loading={isSubmitting}
                disabled={!isEditable}
                onClick={this.openSubmitConfirmModal}
                style={{ marginLeft: '15px' }}
              >
                Submit for Review
              </Button>
            </div>
          </div>
        </div>

        <div className="rup__content">
          <RupBasicInformation
            className="rup__basic_information"
            agreement={agreement}
            plan={plan}
            zone={zone}
            user={user}
          />

          <RupPastures
            className="rup__pastures"
            plan={plan}
          />

          {rupSchedules}
        </div>
      </div>
    );
  }
}

RupAH.propTypes = propTypes;
export default RupAH;