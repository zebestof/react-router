import React from 'react'
import warning from './warning'
import { resolve } from 'path-browserify'
import { formatPattern } from './PatternUtils'

const { bool, object, string, func, oneOfType } = React.PropTypes

function isAbsolute(loc) {
  return loc.pathname.match(/^\//)
}

function constructRoutePattern(route, routes) {
  let pathname = ''
  for (let i = 0, l = routes.length; i < l; i++) {
    if (routes[i] === route) {
      break
    } else {
      pathname += routes[i].path
    }
  }
  pathname += route.path
  return pathname
}

function resolvePathname(relativePath, location, route, routes, params) {
  const patternUpToRoute = constructRoutePattern(route, routes)
  const resolvedPattern = resolve(patternUpToRoute, relativePath)
  return formatPattern(resolvedPattern, params)
}

function isLeftClickEvent(event) {
  return event.button === 0
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

function isEmptyObject(object) {
  for (let p in object)
    if (object.hasOwnProperty(p))
      return false

  return true
}

function createLocationDescriptor(to, { query, hash, state }) {
  if (query || hash || state) {
    return { pathname: to, query, hash, state }
  } else if (typeof to === 'string') {
    return { pathname: to }
  } else {
    return to
  }
}

/**
 * A <Link> is used to create an <a> element that links to a route.
 * When that route is active, the link gets the value of its
 * activeClassName prop.
 *
 * For example, assuming you have the following route:
 *
 *   <Route path="/posts/:postID" component={Post} />
 *
 * You could use the following component to link to that route:
 *
 *   <Link to={`/posts/${post.id}`} />
 *
 * Links may pass along location state and/or query string parameters
 * in the state/query props, respectively.
 *
 *   <Link ... query={{ show: true }} state={{ the: 'state' }} />
 */
const Link = React.createClass({

  contextTypes: {
    router: object
  },

  propTypes: {
    to: oneOfType([ string, object ]).isRequired,
    query: object,
    hash: string,
    state: object,
    activeStyle: object,
    activeClassName: string,
    onlyActiveOnIndex: bool.isRequired,
    onClick: func
  },

  getDefaultProps() {
    return {
      onlyActiveOnIndex: false,
      className: '',
      style: {}
    }
  },

  handleClick(event) {
    let allowTransition = true

    if (this.props.onClick)
      this.props.onClick(event)

    if (isModifiedEvent(event) || !isLeftClickEvent(event))
      return

    if (event.defaultPrevented === true)
      allowTransition = false

    // If target prop is set (e.g. to "_blank") let browser handle link.
    /* istanbul ignore if: untestable with Karma */
    if (this.props.target) {
      if (!allowTransition)
        event.preventDefault()

      return
    }

    event.preventDefault()

    if (allowTransition) {
      const { to, query, hash, state } = this.props
      const location = this.resolveLocation(
        createLocationDescriptor(to, { query, hash, state })
      )

      this.context.router.push(location)
    }
  },

  resolveLocation(loc) {
    if (!isAbsolute(loc)) {
      const { routes, route, location, params } = this.context.router
      loc.pathname = resolvePathname(loc.pathname, location, route, routes, params)
    }
    return loc
  },

  render() {
    const { to, query, hash, state, activeClassName, activeStyle, onlyActiveOnIndex, ...props } = this.props
    warning(
      !(query || hash || state),
      'the `query`, `hash`, and `state` props on `<Link>` are deprecated, use `<Link to={{ pathname, query, hash, state }}/>. http://tiny.cc/router-isActivedeprecated'
    )

    // Ignore if rendered outside the context of router, simplifies unit testing.
    const { router } = this.context

    if (router) {
      const location = this.resolveLocation(
        createLocationDescriptor(to, { query, hash, state })
      )
      props.href = router.createHref(location)

      if (activeClassName || (activeStyle != null && !isEmptyObject(activeStyle))) {
        if (router.isActive(location, onlyActiveOnIndex)) {
          if (activeClassName)
            props.className += props.className === '' ? activeClassName : ` ${activeClassName}`

          if (activeStyle)
            props.style = { ...props.style, ...activeStyle }
        }
      }
    }

    return <a {...props} onClick={this.handleClick} />
  }

})

export default Link
