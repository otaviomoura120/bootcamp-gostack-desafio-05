import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from 'react-icons/fa';
import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, Filter, Pagination } from './styles';

class Repository extends Component {
  constructor() {
    super();
    this.state = {
      repository: {},
      issues: [],
      state: 'open',
      loading: true,
      page: 1,
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const { state, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`repos/${repoName}`),
      api.get(`repos/${repoName}/issues`, {
        params: {
          state,
          per_page: 5,
          page,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handleStateChange = async e => {
    const state = e.target.value;
    await this.setState({ state });
    this.loadIssues();
  };

  loadIssues = async () => {
    const { match } = this.props;
    const { state, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state,
        per_page: 5,
        page,
      },
    });

    this.setState({ issues: response.data });
  };

  handlePageChange = async operation => {
    const { page, repository } = this.state;

    if (operation === 'next') {
      if (!repository.has_pages) {
        return;
      }
      await this.setState({ page: page + 1 });
    } else {
      if (page === 1) {
        return;
      }
      await this.setState({ page: page - 1 });
    }

    this.loadIssues();
  };

  render() {
    const states = ['open', 'closed', 'all'];
    const { repository, issues, loading, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <Filter>
          <select className="stateFilter" onChange={this.handleStateChange}>
            {states.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Filter>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <Pagination>
          <div>
            <FaArrowAltCircleLeft
              size={30}
              onClick={() => this.handlePageChange('prev')}
            />

            <FaArrowAltCircleRight
              size={30}
              onClick={() => this.handlePageChange('next')}
            />
          </div>
          <div>
            <strong>{page}</strong>
          </div>
        </Pagination>
      </Container>
    );
  }
}

Repository.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      repository: PropTypes.string,
    }),
  }).isRequired,
};

export default Repository;
