import React from 'react'
import GSAP from 'react-gsap-enhancer'
import {TweenMax, TimelineMax, Expo} from 'gsap'
import './Sample.scss'

function createCardHoverAnim({ target, options: { panel } }) {
  return new TimelineMax({ paused: true, reversed: true })
          .add(TweenMax.to(target, 0.25, { scale: 1, boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.085)' }))
          .add(TweenMax.to(panel, 0.35, { y: '260px', ease: Expo.easeOut }), '=-0.25')
}

function createPanelAnim({ options: { panel, arrow, buttons } }) {
  return new TimelineMax({ paused: true, reversed: true })
          .add(TweenMax.to(panel, 0.55, { y: 0, ease: Expo.easeOut }))
          .add(TweenMax.to(arrow, 0.35, { rotation: 180, ease: Expo.easeOut }), "=-0.55")
          .add(TweenMax.staggerFrom(buttons.childNodes, 0.35, { y: '100%', opacity: 0, ease: Expo.easeOut }, 0.12), "=-0.55")
}

class Sample extends React.Component {
  componentDidMount() {
    const { arrow, panel, buttons } = this
    this.cardHoverAnimation = this.addAnimation(createCardHoverAnim, { panel })
    this.panelAnimation = this.addAnimation(createPanelAnim, { panel, arrow, buttons })
  }

  onMouseEnter = () => {
    this.cardHoverAnimation.play()
  }

  onMouseLeave = () => {
    if (!this.panelAnimation.reversed()) {
      this.panelAnimation.reverse().timeScale(10)
    }

    this.cardHoverAnimation.reverse()
  }

  onClick = () => {
    this.panelAnimation.reversed() ?
      this.panelAnimation.play().timeScale(1) :
      this.panelAnimation.reverse()
  }

  render () {
    return (
      <div styleName="card" onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <div styleName="panel" ref={element => { this.panel = element }}>
          <div styleName="toggle" onClick={this.onClick}>
            Campaing Actions
            <div styleName="arrow" ref={element => { this.arrow = element }}/>
          </div>
          <div styleName="container" ref={element => { this.buttons = element }}>
            <div styleName="button primary" >View Simulation</div>
            <div styleName="button secondary">Pause Campaign</div>
            <div styleName="button secondary">Complete Campaign</div>
          </div>
        </div>
      </div>
    )
  }
}

export default GSAP()(Sample)