import React from 'react'
import GSAP from 'react-gsap-enhancer'
import {TweenMax, TimelineMax, Expo} from 'gsap'
import arrowIcon from 'assets/icons/action-panel-arrow.svg'
import './Sample.scss'

const Icon = ({ children: __html, ...rest }) => <span dangerouslySetInnerHTML={{ __html }} {...rest} />

function createCardHoverInAnim({ target, options: { panel } }) {
  return new TimelineMax({ paused: true, reversed: false })
          .add(TweenMax.to(target, 0.25, { scale: 1, boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.085)' }))
          .add(TweenMax.to(panel, 0.35, { y: '260px', ease: Expo.easeOut }), '=-0.25')
}

function createCardHoverOutAnim({ target, options: { panel } }) {
  return new TimelineMax({ paused: true, reversed: false })
          .add(TweenMax.to(target, 0.25, { scale: 1, boxShadow: '0px 6px 22px rgba(0, 0, 0, 0.12)' }))
          .add(TweenMax.to(panel, 0.35, { y: '310px', ease: Expo.easeOut }), '=-0.25')
}

function createPanelAnim({ options: { panel, arrow, buttons } }) {
  return new TimelineMax({ paused: true, reversed: true })
          .add(TweenMax.to(panel, 0.55, { y: 0, ease: Expo.easeOut }))
          .add(TweenMax.to(arrow, 0.35, { rotation: 180, ease: Expo.easeOut }), '=-0.55')
          .add(TweenMax.staggerFrom(buttons.childNodes, 0.35, { y: '100%', opacity: 0, ease: Expo.easeOut }, 0.12), '=-0.55')
}

class Sample extends React.Component {
  componentDidMount() {
    const { arrow, panel, buttons } = this
    this.cardHoverInAnimation = this.addAnimation(createCardHoverInAnim, { panel })
    this.cardHoverOutAnimation = this.addAnimation(createCardHoverOutAnim, { panel })
    this.panelAnimation = this.addAnimation(createPanelAnim, { panel, arrow, buttons })
  }

  onMouseEnter = () => {
    this.cardHoverInAnimation.restart()
  }

  onMouseLeave = () => {
    if (!this.panelAnimation.reversed()) {
      this.panelAnimation.time(0).timeScale(10).reverse()
    }

    this.cardHoverOutAnimation.restart()
  }

  onClick = () => {
    this.panelAnimation.reversed() ?
      this.panelAnimation.timeScale(1).play() :
      this.panelAnimation.timeScale(1).reverse()
  }

  render() {
    return (
      <div styleName="card" onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <div>fdsafsa</div>
        <div styleName="panel" ref={element => { this.panel = element }}>
          <div styleName="toggle" onClick={this.onClick}>
            Campaing Actions
            <div styleName="arrow" ref={element => { this.arrow = element }}>
              <Icon>{arrowIcon}</Icon>
            </div>
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
