import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, Button, Icon } from 'semantic-ui-react';
import debounce from 'lodash.debounce';
import { Banner } from '../common';
import * as strings from '../../constants/strings';
import { ELEMENT_ID, CONFIRMATION_MODAL_ID } from '../../constants/variables';
import { getUserFullName } from '../../utils';

const propTypes = {
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  usersMap: PropTypes.shape({}).isRequired,
  clients: PropTypes.arrayOf(PropTypes.object).isRequired,
  searchClients: PropTypes.func.isRequired,
  updateClientIdOfUser: PropTypes.func.isRequired,
  userUpdated: PropTypes.func.isRequired,
  isFetchingClients: PropTypes.bool.isRequired,
  openConfirmationModal: PropTypes.func.isRequired,
  closeConfirmationModal: PropTypes.func.isRequired,
};

class ManageClient extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: null,
      clientNumber: null,
      searchQuery: '',
    };
    this.searchClientsWithDebounce = debounce(this.handleSearchChange, 1000);
  }

  onUserChanged = (e, { value: userId }) => {
    this.setState({ userId });
  }

  onClientChanged = (e, { value: clientNumber }) => {
    this.setState({ clientNumber });
  }

  openUpdateConfirmationModal = () => {
    this.props.openConfirmationModal({
      modal: {
        id: CONFIRMATION_MODAL_ID.MANAGE_CLIENT,
        header: strings.MANAGE_CLIENT_BANNER_HEADER,
        content: strings.MANAGE_CLIENT_BANNER_CONTENT,
        onYesBtnClicked: this.linkUserToClient,
      },
    });
  }

  handleSearchChange = (e, { searchQuery }) => {
    this.setState({ searchQuery });
    this.props.searchClients(searchQuery);
  }

  linkUserToClient = () => {
    const { userId, clientNumber } = this.state;
    const { usersMap, userUpdated, updateClientIdOfUser, closeConfirmationModal } = this.props;

    closeConfirmationModal({ modalId: CONFIRMATION_MODAL_ID.MANAGE_CLIENT });
    const onSuccess = (newUser) => {
      const user = {
        ...usersMap[userId],
        clientId: newUser.clientId,
      };

      userUpdated(user);

      this.setState({
        userId: null,
        clientNumber: null,
      });
    };
    updateClientIdOfUser(userId, clientNumber).then(onSuccess);
  }

  render() {
    const {
      users,
      clients,
      isFetchingClients,
    } = this.props;
    const {
      userId,
      clientNumber,
      searchQuery,
    } = this.state;

    const userOptions = users.map((user) => {
      const { email, clientId } = user;
      const description = clientId ? `Client #: ${clientId}, Email: ${email}` : `Email: ${email}`;
      return {
        value: user.id,
        text: getUserFullName(user),
        description,
      };
    });

    const clientOptions = clients.map((c) => {
      const { clientNumber, name } = c;
      return {
        key: clientNumber,
        value: clientNumber,
        text: name,
        description: `Client #: ${clientNumber}`,
      };
    });

    const isUpdateBtnEnabled = userId && clientNumber;
    let noResultsMessage = strings.NO_RESULTS_FOUND;
    if (isFetchingClients) {
      noResultsMessage = 'Fetching clients...';
    } else if (!searchQuery) {
      noResultsMessage = strings.TYPE_CLIENT_NAME;
    }

    return (
      <section className="manage-client">
        <Banner
          header={strings.MANAGE_CLIENT_BANNER_HEADER}
          content={strings.MANAGE_CLIENT_BANNER_CONTENT}
        />

        <div className="manage-client__content">
          <div className="manage-client__steps">
            <h3>Step 1: Select User</h3>
            <Dropdown
              id={ELEMENT_ID.MANAGE_CLIENT_USERS_DROPDOWN}
              placeholder="Select User"
              options={userOptions}
              value={userId}
              onChange={this.onUserChanged}
              search
              selection
              selectOnBlur={false}
            />

            <h3>Step 2: Search and Select Corresponding Client</h3>
            <Dropdown
              id={ELEMENT_ID.MANAGE_CLIENT_CLIENTS_DROPDOWN}
              placeholder={strings.TYPE_CLIENT_NAME}
              options={clientOptions}
              value={clientNumber}
              search
              selection
              loading={isFetchingClients}
              onChange={this.onClientChanged}
              onSearchChange={this.searchClientsWithDebounce}
              icon={<Icon name="search" size="small" />}
              noResultsMessage={noResultsMessage}
              selectOnBlur={false}
            />

            <div className="manage-client__update-btn">
              <Button
                primary
                onClick={this.openUpdateConfirmationModal}
                disabled={!isUpdateBtnEnabled}
              >
                Link
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

ManageClient.propTypes = propTypes;
export default ManageClient;