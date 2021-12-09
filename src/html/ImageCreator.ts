export function buildProgressiveCircle(number: Number): string {
  return `<html>
  <body>
    <div class="box">
      <div class="percent">
        <svg>
          <circle cx="70" cy="70" r="70"></circle>
          <circle cx="70" cy="70" r="70"></circle>
        </svg>
        <div class="number">
          <h2>${number}<span>%</span></h2>
        </div>
  </body>
  <style>
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900&display=swap');
  
    * {
      margin: 0;
      padding: 0;
      font-family: 'Roboto', sans-serif;
    }
  
    body {
      width: 160px;
      height: 160px;
      display: flex;
      justify-content: center;
    }
  
    .box {
      position: relative;
      width: 160px;
      height: 160px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }
  
    .box .percent {
      position: relative;
      width: 150px;
      height: 150px;
    }
  
    .box .percent svg {
      position: relative;
      width: 150px;
      height: 150px;
    }
  
    .box .percent svg circle {
      width: 150px;
      height: 150px;
      fill: none;
      stroke-width: 10;
      stroke: #000;
      transform: translate(5px, 5px);
      stroke-dasharray: 440;
      stroke-dashoffset: 440;
      stroke-linecap: round;
    }
  
    .box .percent svg circle:nth-child(1) {
      stroke-dashoffset: 0;
      stroke: #989996
    }
  
    .box .percent svg circle:nth-child(2) {
      stroke-dashoffset: calc(440 - (440 * ${number})/100);
      stroke: #1fff4b;
    }
  
    .box .percent .number {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #999;
    }
  
    .box .percent .number h2 {
      font-size: 48px;
    }
  
    .box .percent .number h2 span {
      font-size: 24px;
    }
  
    .box .text {
      padding: 10px 0 0;
      color: #999;
      font-weight: 1px;
    }
  </style>
  </html>`
}