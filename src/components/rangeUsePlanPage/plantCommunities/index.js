import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import uuid from 'uuid-v4'
import PlantCommunityBox from './PlantCommunityBox'
import AddPlantCommunityButton from './AddPlantCommunityButton'
import { FieldArray } from 'formik'
import { NOT_PROVIDED } from '../../../constants/strings'
import { IfEditable } from '../../common/PermissionsField'
import { PLANT_COMMUNITY } from '../../../constants/fields'
import { Confirm } from 'semantic-ui-react'
import { deletePlantCommunity } from '../../../api'

const PlantCommunities = ({
  plantCommunities = [],
  namespace,
  planId,
  pastureId
}) => {
  const isEmpty = plantCommunities.length === 0
  const [activeIndex, setActiveIndex] = useState(-1)
  const [indexToRemove, setIndexToRemove] = useState(null)

  return (
    <FieldArray
      name={`${namespace}.plantCommunities`}
      render={({ push, remove }) => (
        <div className="rup__plant-communities">
          <div className="rup__plant-communities__title">Plant Communities</div>
          <IfEditable permission={PLANT_COMMUNITY.NAME}>
            <AddPlantCommunityButton
              onSubmit={plantCommunity => {
                push({
                  ...plantCommunity,
                  communityTypeId: plantCommunity.id,
                  indicatorPlants: [],
                  plantCommunityActions: [],
                  purposeOfAction: 'none',
                  monitoringAreas: [],
                  aspect: '',
                  elevationId: null,
                  url: '',
                  approved: false,
                  notes: '',
                  rangeReadinessDay: null,
                  rangeReadinessMonth: null,
                  rangeReadinessNote: null,
                  shrubUse: '',
                  id: uuid()
                })
              }}
            />
          </IfEditable>

          <IfEditable permission={PLANT_COMMUNITY.NAME} invert>
            {isEmpty && (
              <div className="rup__plant-communities__not-provided">
                {NOT_PROVIDED}
              </div>
            )}
          </IfEditable>

          <Confirm
            header={`Delete plant community '${plantCommunities[
              indexToRemove
            ] && plantCommunities[indexToRemove].name}'`}
            open={indexToRemove !== null}
            onCancel={() => {
              setIndexToRemove(null)
            }}
            onConfirm={async () => {
              const community = plantCommunities[indexToRemove]

              if (!uuid.isUUID(community.id)) {
                await deletePlantCommunity(planId, pastureId, community.id)
              }

              remove(indexToRemove)
              setIndexToRemove(null)
            }}
          />

          <ul
            className={classnames('collaspible-boxes', {
              'collaspible-boxes--empty': isEmpty
            })}>
            {plantCommunities.map((plantCommunity, index) => (
              <PlantCommunityBox
                key={plantCommunity.id}
                plantCommunity={plantCommunity}
                activeIndex={activeIndex}
                index={index}
                planId={planId}
                pastureId={pastureId}
                onClick={() => {
                  index === activeIndex
                    ? setActiveIndex(-1)
                    : setActiveIndex(index)
                }}
                onDelete={() => setIndexToRemove(index)}
                namespace={`${namespace}.plantCommunities.${index}`}
              />
            ))}
          </ul>
        </div>
      )}
    />
  )
}

PlantCommunities.propTypes = {
  plantCommunities: PropTypes.array.isRequired,
  namespace: PropTypes.string.isRequired
}

export default PlantCommunities
