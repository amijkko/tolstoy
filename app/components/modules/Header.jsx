import React from 'react';
import { Link } from 'react-router';
import {connect} from 'react-redux';
import TopRightMenu from 'app/components/modules/TopRightMenu';
import Icon from 'app/components/elements/Icon.jsx';
import resolveRoute from 'app/ResolveRoute';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import { translate } from 'app/Translator';
import HorizontalMenu from 'app/components/elements/HorizontalMenu';
import { APP_NAME, APP_ICON } from 'config/client_config';
import { detransliterate } from 'app/utils/ParsersAndFormatters';

function sortOrderToLink(so, topic, account) {
    if (so === 'home') return '/@' + account + '/feed';
    if (topic) return `/${so}/${topic}`;
    return `/${so}`;
}

class Header extends React.Component {
    static propTypes = {
        location: React.PropTypes.object.isRequired,
        current_account_name: React.PropTypes.string
    };

    constructor() {
        super();
        this.state = {subheader_hidden: false}
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Header');
        this.hideSubheader = this.hideSubheader.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.location.pathname !== this.props.location.pathname) {
            /**
             * To track page changes analytics for segment.io in SPA we need to
             * specifically track route changes
             * (we are not doing it somewhere in router because react-router does multiple
             * route iterations and it is hard to track only one page change event)
             */
            try {
                if(process.env.BROWSER) analytics.page(nextProps.location.pathname);
            } catch (e) { console.warn(e) }
            const route = resolveRoute(nextProps.location.pathname);
            if (route && route.page === 'PostsIndex' && route.params && route.params.length > 0) {
                const sort_order = route.params[0] !== 'home' ? route.params[0] : null;
                if (sort_order) window.last_sort_order = this.last_sort_order = sort_order;
            }
        }
    }

    hideSubheader(){
        const subheader_hidden = this.state.subheader_hidden;
        const y = window.scrollY >= 0 ? window.scrollY : document.documentElement.scrollTop;
        if (y === this.prevScrollY) return;
        if (y < 5) {
            this.setState({subheader_hidden: false});
        } else if (y > this.prevScrollY) {
            if (!subheader_hidden) this.setState({subheader_hidden: true})
        } else {
            if (subheader_hidden) this.setState({subheader_hidden: false})
        }
        this.prevScrollY = y;
    }

    componentDidMount() {
        window.addEventListener('scroll', this.hideSubheader);
        // identify user for proper segment.io analytics data
        analytics.identify(this.props.current_account_name);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.hideSubheader);
    }

    render() {
        const route = resolveRoute(this.props.location.pathname);
        const current_account_name =  this.props.current_account_name;
        let home_account = false;
        let page_title = route.page;

        let sort_order = '';
        let topic = '';
        let user_name = null;
        let page_name = null;

        if (route.page === 'PostsIndex') {
            sort_order = route.params[0];
            if (sort_order === 'home') {
                page_title = "Лента"
                const account_name = route.params[1];
                if (current_account_name && account_name.indexOf(current_account_name) === 1)
                    home_account = true;
            } else {
                if (route.params.length > 1) {
                    topic = route.params[1];
                    page_title = `${topic}/${sort_order}`;
                } else {
                    page_title = `${sort_order}`;
                }
            }
        } else if (route.page === 'Post') {
            sort_order = '';
            topic = route.params[0];
        } else if (route.page === 'UserProfile') {
            user_name = route.params[0].slice(1);
            page_title = user_name;
        } else {
            page_name = ''; //page_title = route.page.replace( /([a-z])([A-Z])/g, '$1 $2' ).toLowerCase();
        }

        if (process.env.BROWSER && route.page !== 'Post') document.title = page_title + ' — ' + APP_NAME;

        const logo_link = route.params && route.params.length > 1 && this.last_sort_order ? '/' + this.last_sort_order : '/hot';
        let topic_link = topic ? <Link to={`/${this.last_sort_order || 'hot'}/${topic}`}>{detransliterate(topic)}</Link> : null;

        const sort_orders = [
            ['created', translate('new')],
            ['hot', translate('hot')],
            ['trending', translate('trending_24_hour')],
            // disabled until crowdsale starts
            // ['trending30', translate('trending_30_day')],
            // promotion functionality currently does not work
            // ['promoted', translate('promoted')],
            ['active', translate('active')]
        ];
        if (current_account_name) sort_orders.unshift(['home', translate('home')]);
        const sort_order_menu = sort_orders.filter(so => so[0] !== sort_order).map(so => ({link: sortOrderToLink(so[0], topic, current_account_name), value: so[1]}));
        // there were a problem when in root route ('/') when header menu didn't
        // had any active links. Thats why selected_sort_order falls down to 'trending' if undefined
        const selected_sort_order = sort_orders.find(so => so[0] === sort_order) || sort_orders[2];
        const sort_orders_horizontal = [
            ['created', translate('new')],
            ['hot', translate('hot')],
            ['trending', translate('trending')],
            // ['promoted', translate('promoted')],
            ['active', translate('active')]
        ];
        if (current_account_name) sort_orders_horizontal.unshift(['home', translate('home')]);
        const sort_order_menu_horizontal = sort_orders_horizontal.map(so => {
                let active = (so[0] === sort_order) || (so[0] === 'trending' && sort_order === 'trending30');
                if (so[0] === 'home' && sort_order === 'home' && !home_account) active = false;
                return {link: sortOrderToLink(so[0], topic, current_account_name), value: so[1], active};
            });

        let sort_order_extra_menu = null;
        if (sort_order === 'trending' || sort_order === 'trending30') {
            const items = [
                {link: `/trending/${topic}`, value: translate('24_hour'), active: sort_order === 'trending'},
                {link: `/trending30/${topic}`, value: translate('30_day'), active: sort_order === 'trending30'}
            ];
            // hide extra menu until crowdsale start because they make no sense
            // sort_order_extra_menu = <HorizontalMenu items={items} />
        }

        return (
            <header className="Header noPrint">
                <div className="Header__top header">
                    <div className="expanded row">
                        <div className="columns">
                            <ul className="menu">
                                <li className="Header__top-logo">
                                    <Link to={logo_link}>
                                        <Icon name={APP_ICON} size="2x" />
                                    </Link>
                                </li>

                                <li className="Header__top-steemit show-for-medium noPrint">
                                    <Link to={logo_link}>{APP_NAME}<span className="beta">alpha</span></Link>
                                </li>

                                {(topic_link || user_name || page_name) && <li className="delim show-for-medium">|</li>}
                                {topic_link && <li className="Header__top-topic">{topic_link}</li>}
                                {user_name && <li><Link to={`/@${user_name}`}>{user_name}</Link></li>}
                                {page_name && <li><span>{page_name}</span></li>}
                                {(topic_link || user_name || page_name) && sort_order && <li className="delim show-for-small-only">|</li>}
                                {selected_sort_order && <DropdownMenu className="Header__sort-order-menu show-for-small-only" items={sort_order_menu} selected={selected_sort_order[1]} el="li" />}
                            </ul>
                        </div>
                        <div className="columns shrink">
                            <TopRightMenu {...this.props} />
                        </div>
                    </div>
                </div>
                <div className={'Header__sub-nav expanded show-for-medium row' + (this.state.subheader_hidden ? ' hidden' : '')}>
                    <div className="columns">
                        <HorizontalMenu items={sort_order_menu_horizontal} />
                    </div>
                    <div className="columns shrink">
                        {sort_order_extra_menu}
                    </div>
                </div>
            </header>
        );
    }
}

export {Header as _Header_};

export default connect(
    state => {
        const current_user = state.user.get('current');
        const current_account_name = current_user ? current_user.get('username') : state.offchain.get('account');
        return {
            location: state.app.get('location'),
            current_account_name
        }
    }
)(Header);
