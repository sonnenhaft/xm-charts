import {
    selection as Selection,
    transition as Transition,
} from 'd3'

const methods = {
    attrs: function (object) {
        Object.keys(object).forEach(key => {
            this.attr(key, object[key])
        })
        return this
    },
    bindData: function (tag, data, opt_attrs = {}) {
        const className = opt_attrs['class']
        const selector = className ? `${tag}.${className}` : tag
        const enteredSelection = this.selectAll(selector).data(data)
        enteredSelection.exit( ).remove( )
        return enteredSelection.enter( ).append(tag)
            .attrs(opt_attrs)
            .merge(enteredSelection).transition( ).attrs(opt_attrs)
    },
}
Object.assign(Selection.prototype, methods)
Object.assign(Transition.prototype, methods)
