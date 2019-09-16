import * as Yup from 'yup'
import moment from 'moment'

const handleNull = (defaultValue = '') => v => (v === null ? defaultValue : v)

const RUPSchema = Yup.object().shape({
  rangeName: Yup.string(),
  altBusinessName: Yup.string().transform(handleNull()),
  planStartDate: Yup.string()
    .required()
    .transform(v => moment(v).format('MMMM DD, YYYY')),
  planEndDate: Yup.string()
    .required()
    .transform(v => moment(v).format('MMMM DD, YYYY')),
  pastures: Yup.array().of(
    Yup.object().shape({
      allowableAum: Yup.number()
        .nullable()
        .transform(handleNull(0)),
      graceDays: Yup.number(),
      name: Yup.string().required('Please enter a name'),
      notes: Yup.string()
        .transform(handleNull())
        .nullable(),
      planId: Yup.number(),
      pldPercent: Yup.number()
        .typeError('Please enter a number')
        .nullable()
        .transform(handleNull(0)),
      plantCommunities: Yup.array().of(
        Yup.object().shape({
          approved: Yup.bool().required(),
          aspect: Yup.string()
            .nullable()
            .transform(handleNull()),
          elevation: Yup.number()
            .required()
            .nullable()
            .transform(handleNull(0)),
          notes: Yup.string()
            .transform(handleNull())
            .required(),
          url: Yup.string().transform(handleNull()),
          purposeOfAction: Yup.string().required(),
          shrubUse: Yup.string().transform(handleNull()),
          rangeReadinessDate: Yup.string()
            .required()
            .default(moment().format('MMMM DD'))
        })
      )
    })
  ),
  grazingSchedules: Yup.array().of(
    Yup.object().shape({
      id: Yup.number().required(),
      narative: Yup.string()
        .required()
        .transform(handleNull()),
      grazingScheduleEntries: Yup.array().of(
        Yup.object().shape({
          dateIn: Yup.string()
            .required()
            .transform(v => moment(v).format('MMMM DD, YYYY')),
          dateOut: Yup.string()
            .required()
            .transform(v => moment(v).format('MMMM DD, YYYY'))
        })
      )
    })
  ),
  invasivePlantChecklist: Yup.object().shape({
    equipmentAndVehiclesParking: Yup.bool()
      .required()
      .default(false),
    beginInUninfestedArea: Yup.bool()
      .required()
      .default(false),
    undercarrigesInspected: Yup.bool()
      .required()
      .default(false),
    revegetate: Yup.bool()
      .required()
      .default(false),
    other: Yup.string().transform(handleNull())
  })
})

export default RUPSchema
