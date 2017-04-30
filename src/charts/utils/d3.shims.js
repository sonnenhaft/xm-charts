import * as d3 from 'd3'

const methods = {
  styles: function(stylesAsObject) {
    Object.keys(stylesAsObject).forEach(key => {
      this.style(key, stylesAsObject[key])
    })
    return this
  },
  moveToFront: function() {
    return this.each(function() {
      this.parentNode.appendChild(this)
    })
  },
  attrs: function(object, noEvents = false) {
    const mouseEvents = ['mouseover', 'mouseout', 'click']
    Object.keys(object).forEach(key => {
      const value = object[key]
      if (key === 'html') {
        if ( !noEvents ) {
          this.html(value)
        }
      } else if ( key === 'text' ) {
        this.text(value)
      } else if ( mouseEvents.includes(key) ) {
        if ( !noEvents ) {
          this.on(key, value)
        }
      } else {
        this.attr(key, value)
      }
    })
    return this
  },
  bindData: function(tagAndClass, data, opt_attrs, duration) {
    const [tag, className] = tagAndClass.split('.')
    const selector = className ? `${tag}.${className}` : tag
    const enteredSelection = this.selectAll(selector).data(data, ({ id }) => id)
    enteredSelection.exit().remove()
    const mergedSelection = enteredSelection.enter().append(tag)
      .attr('class', className)
    mergedSelection
      .attrs(opt_attrs)
      .merge(enteredSelection)
      .transition()
      .duration(duration)
      .attrs(opt_attrs, true)
    return mergedSelection
  },
}

Object.assign(d3.selection.prototype, methods)
Object.assign(d3.transition.prototype, methods)


export default d3
