import React from 'react'
import './Loader.scss'

const SIZE = {
  lg: {
    transform: 'scale(1)',
  },
  md: {
    transform: 'scale(0.5)',
  },
  sm: {
    transform: 'scale(0.25)',
  },
}

const Loader = ({ size = 'lg', text }) => (
  <div styleName='wrapper'>
    <div styleName='container' style={SIZE[size]}>
      <div styleName='loader'>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {text &&
        <div styleName="description">{text}</div>
      }
    </div>
  </div>
)

export default Loader
