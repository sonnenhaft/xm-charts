import {
  selection as Selection,
  transition as Transition,
} from 'd3'

const methods = {
  attrs: function (object) {
    Object.keys(object).forEach(key => {
      if (key === 'text') {
        this.text(object[key])
      } else {
        this.attr(key, object[key])
      }
    })
    return this
  },
  bindData: function (tagAndClass, data, opt_attrs = {}, duration) {
    const [tag, className] = tagAndClass.split('.')
    const selector = className ? `${tag}.${className}` : tag
    const enteredSelection = this.selectAll(selector).data(data)
    enteredSelection.exit().remove()
    return enteredSelection.enter().append(tag)
      .attr('class', className)
      .attrs(opt_attrs)
      .merge(enteredSelection)
      .transition()
      .duration(duration)
      .attrs(opt_attrs)
  },
}
Object.assign(Selection.prototype, methods)
Object.assign(Transition.prototype, methods)
