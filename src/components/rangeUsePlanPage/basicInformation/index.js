import React from 'react'
import PropTypes from 'prop-types'
import { TextField } from '../../common'
import * as strings from '../../../constants/strings'
import {
  formatDateFromServer,
  capitalize,
  getUserFullName,
  getAgreementHolders,
  getClientFullName
} from '../../../utils'
import PermissionsField from '../../common/PermissionsField'
import { BASIC_INFORMATION } from '../../../constants/fields'
import DateInputField from '../../common/form/DateInputField'

const BasicInformation = ({ plan, agreement }) => {
  const zone = agreement && agreement.zone
  const zoneCode = zone && zone.code
  const district = zone && zone.district
  const districtCode = district && district.code

  const staff = zone && zone.user
  const contactEmail = staff && staff.email
  const contactPhoneNumber = staff && staff.phoneNumber
  const contactName = getUserFullName(staff)

  const { rangeName, altBusinessName, planStartDate, planEndDate, extension } =
    plan || {}

  const {
    id: agreementId,
    agreementStartDate,
    agreementEndDate,
    agreementExemptionStatus: aes,
    clients
  } = agreement || {}

  const exemptionStatusName = aes && aes.description
  const { primaryAgreementHolder, otherAgreementHolders } = getAgreementHolders(
    clients
  )
  const primaryAgreementHolderName = getClientFullName(primaryAgreementHolder)

  return (
    <div className="rup__basic_information">
      <div className="rup__content-title">Basic Information</div>
      <div className="rup__row">
        <div className="rup__agreement-info rup__cell-6">
          <div className="rup__divider" />
          <div className="rup__info-title">Agreement Information</div>
          <TextField label={strings.RANGE_NUMBER} text={agreementId} />
          <TextField label={strings.AGREEMENT_TYPE} text="Primary" />
          <TextField
            label={strings.AGREEMENT_DATE}
            text={`${formatDateFromServer(
              agreementStartDate
            )} to ${formatDateFromServer(agreementEndDate)}`}
          />
          <PermissionsField
            permission={BASIC_INFORMATION.RANGE_NAME}
            name="rangeName"
            displayValue={capitalize(rangeName)}
            label={strings.RANGE_NAME}
            fast
          />

          <PermissionsField
            permission={BASIC_INFORMATION.ALTERNATE_BUSINESS_NAME}
            name="altBusinessName"
            displayValue={altBusinessName}
            label={strings.ALTERNATIVE_BUSINESS_NAME}
            fast
          />
        </div>
        <div className="rup__contact-info rup__cell-6">
          <div className="rup__divider" />
          <div className="rup__info-title">Contact Information</div>
          <TextField label={strings.DISTRICT} text={districtCode} />
          <TextField label={strings.ZONE} text={zoneCode} />
          <TextField label={strings.CONTACT_NAME} text={contactName} />
          <TextField label={strings.CONTACT_PHONE} text={contactPhoneNumber} />
          <TextField label={strings.CONTACT_EMAIL} text={contactEmail} />
        </div>
      </div>
      <div className="rup__row">
        <div className="rup__plan-info rup__cell-6">
          <div className="rup__divider" />
          <div className="rup__info-title">Plan Information</div>
          <PermissionsField
            name="planStartDate"
            permission={BASIC_INFORMATION.PLAN_START_DATE}
            component={DateInputField}
            displayValue={planStartDate}
            label={strings.PLAN_START_DATE}
            dateFormat="MMMM DD, YYYY"
          />
          <PermissionsField
            name="planEndDate"
            permission={BASIC_INFORMATION.PLAN_END_DATE}
            component={DateInputField}
            displayValue={planEndDate}
            label={strings.PLAN_END_DATE}
            dateFormat="MMMM DD, YYYY"
          />
          <TextField label={strings.EXTENDED} text={extension} />
          <TextField
            label={strings.EXEMPTION_STATUS}
            text={exemptionStatusName}
          />
        </div>

        <div className="rup__plan-info rup__cell-6">
          <div className="rup__divider" />
          <div className="rup__info-title">Agreement Holders</div>
          <TextField
            label={strings.PRIMARY_AGREEMENT_HOLDER}
            text={primaryAgreementHolderName}
          />
          {otherAgreementHolders.map(client => (
            <TextField
              key={client.id}
              label={strings.OTHER_AGREEMENT_HOLDER}
              text={getClientFullName(client)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

BasicInformation.propTypes = {
  plan: PropTypes.shape({}).isRequired,
  agreement: PropTypes.shape({}).isRequired
}

export default BasicInformation
