import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { FieldArray, connect } from 'formik'
import uuid from 'uuid-v4'
import { IfEditable } from '../../common/PermissionsField'
import { PLANT_COMMUNITY } from '../../../constants/fields'
import { Button, Confirm } from 'semantic-ui-react'
import PlantCommunityAction from './PlantCommunityAction'

const PlantCommunityActionsBox = ({ actions, namespace }) => {
  const [toRemove, setToRemove] = useState(null)

  return (
    <FieldArray
      name={`${namespace}.plantCommunityActions`}
      render={({ push, remove }) => (
        <>
          {actions.map((action, index) => (
            <PlantCommunityAction
              action={action}
              key={action.id || `action${index}`}
              namespace={`${namespace}.plantCommunityActions.${index}`}
              onDelete={() => {
                setToRemove(index)
              }}
            />
          ))}
          <Confirm
            open={toRemove !== null}
            onCancel={() => {
              setToRemove(null)
            }}
            onConfirm={() => {
              remove(toRemove)
              setToRemove(null)
            }}
          />
          <IfEditable permission={PLANT_COMMUNITY.ACTIONS.NAME}>
            <Button
              primary
              type="button"
              className="icon labeled rup__plant-communities__add-button"
              onClick={() =>
                push({ actionTypeId: null, details: '', id: uuid() })
              }>
              <i className="add circle icon" />
              Add Action
            </Button>
          </IfEditable>
        </>
      )}
    />
  )
}

PlantCommunityActionsBox.propTypes = {
  actions: PropTypes.array.isRequired,
  namespace: PropTypes.string.isRequired
}

export default connect(PlantCommunityActionsBox)
