<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<meta name="design_doc_mode" content="canvas">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<script src="image-slot.js"></script>
<style>
  *{ box-sizing:border-box; }
  body{ margin:0; }
  .mochi{ position:relative; display:inline-block; background:radial-gradient(ellipse 50% 42% at 50% 80%, #FFFDF8 0%, #F5E4D2 58%, rgba(245,228,210,0) 62%), linear-gradient(158deg,#F3B49B,#E2855F); border-radius:47% 47% 49% 49%/57% 57% 43% 43%; box-shadow:inset 0 4px 6px rgba(255,255,255,.5), inset 0 -5px 9px rgba(168,90,64,.32); flex:none; }
  @keyframes floaty{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-9px) } }
  image-slot{ --is-bg:#F1E4D4; }
</style>
</helmet>

<div style="position:absolute;left:80px;top:30px;font-family:'IBM Plex Mono',monospace;font-size:14px;letter-spacing:.04em;color:#6f6456">motoo — 하이파이 랜딩 · 크리에이터 / 후원자 두 페이지</div>

<!-- ================= CREATOR LANDING ================= -->
<div style="position:absolute;left:80px;top:96px;width:1440px">
  <div data-drags-parent="1" style="position:absolute;top:-26px;font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.06em;color:#8a7d6c">motoo for creators · 크리에이터 랜딩</div>
  <div style="background:#FBF6EF;border:1px solid #ECE1D2;border-radius:16px;box-shadow:0 30px 80px rgba(33,28,24,.14);overflow:hidden;font-family:'Pretendard',sans-serif;color:#211C18">

    <!-- nav -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 56px;border-bottom:1px solid #ECE1D2;background:rgba(251,246,239,.9)">
      <div style="display:flex;align-items:center;gap:10px"><span class="mochi" style="width:26px;height:21px"></span><span style="font-size:24px;font-weight:800;letter-spacing:-.04em">motoo</span></div>
      <div style="display:flex;align-items:center;gap:30px;font-size:15px;font-weight:500;color:#5c5246">
        <span>기능</span><span>트러스트 리포트</span><span>수수료</span>
        <span style="display:flex;align-items:center;gap:5px;color:#9b8d7c;font-size:14px">후원자용 <span style="font-size:12px">↗</span></span>
        <span style="color:#211C18;font-weight:600">로그인</span>
        <span style="padding:11px 20px;border-radius:12px;background:#E08A6F;color:#fff;font-weight:700;box-shadow:0 6px 16px rgba(224,138,111,.3)">크리에이터 신청</span>
      </div>
    </div>

    <!-- hero -->
    <div style="position:relative;padding:74px 56px 90px;overflow:hidden">
      <div style="position:absolute;top:-120px;right:-80px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle at 40% 40%,rgba(240,163,140,.30),rgba(240,163,140,0) 62%);pointer-events:none"></div>
      <div style="position:relative;display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center">
        <!-- copy -->
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#C9694C;font-weight:500;margin-bottom:22px">motoo for creators</div>
          <h1 style="margin:0;font-size:62px;line-height:1.1;font-weight:800;letter-spacing:-.035em">팬의 응원을,<br>스폰서에게 보여줄<br><span style="color:#C9694C;border-bottom:5px solid #F2B5A0;padding-bottom:2px">증거</span>로.</h1>
          <p style="font-size:19px;line-height:1.62;color:#74695F;margin:26px 0 34px;max-width:480px">모찌로 받은 팬들의 응원을 매달 한 장의 <b style="color:#211C18">트러스트 리포트</b>로. 브랜드·스폰서·MCN에게 진짜 팬덤을 증명하세요.</p>
          <div style="display:flex;align-items:center;gap:14px">
            <span style="display:inline-flex;align-items:center;gap:9px;padding:17px 30px;border-radius:14px;background:#E08A6F;color:#fff;font-weight:700;font-size:17px;box-shadow:0 10px 24px rgba(224,138,111,.34)">크리에이터로 신청하기 <span>→</span></span>
            <span style="display:inline-flex;align-items:center;gap:9px;padding:17px 28px;border-radius:14px;background:#fff;color:#211C18;font-weight:700;font-size:17px;border:1.5px solid #E4D8C8">샘플 리포트 보기</span>
          </div>
          <div style="display:flex;align-items:center;gap:18px;margin-top:30px;font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9b8d7c;letter-spacing:.02em">
            <span style="display:flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:50%;background:#7E9B82"></span> 라이선스 PG 직접 결제</span>
            <span>·</span><span>플랫폼은 자금을 보유하지 않음</span>
          </div>
        </div>
        <!-- visual: trust report card -->
        <div style="position:relative;height:480px">
          <div style="position:absolute;top:34px;left:24px;right:8px;background:#fff;border:1px solid #EEE3D5;border-radius:24px;box-shadow:0 28px 60px rgba(33,28,24,.16);padding:24px;transform:rotate(-2deg)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
              <image-slot id="cl_hero_avatar" style="width:46px;height:46px" shape="circle" placeholder="아바타"></image-slot>
              <div style="flex:1"><div style="font-weight:800;font-size:17px">@크리에이터A</div><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9b8d7c">TRUST REPORT · 2026.06</div></div>
              <div style="padding:6px 13px;border-radius:999px;background:#EAF0EA;color:#4f6b53;font-weight:700;font-size:13px;border:1px solid #CFE0D2">STRONG</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
              <div style="background:#FBF6EF;border:1px solid #EEE3D5;border-radius:14px;padding:13px"><div style="font-size:24px;font-weight:800;letter-spacing:-.02em">312</div><div style="font-size:12px;color:#9b8d7c">총 백커</div></div>
              <div style="background:#FBF6EF;border:1px solid #EEE3D5;border-radius:14px;padding:13px"><div style="font-size:24px;font-weight:800;letter-spacing:-.02em">41%</div><div style="font-size:12px;color:#9b8d7c">재후원율</div></div>
              <div style="background:#FBF6EF;border:1px solid #EEE3D5;border-radius:14px;padding:13px"><div style="font-size:24px;font-weight:800;letter-spacing:-.02em">94%</div><div style="font-size:12px;color:#9b8d7c">퍼크 이행</div></div>
            </div>
            <div style="background:#FBF6EF;border:1px solid #EEE3D5;border-radius:14px;padding:14px 14px 8px">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:#9b8d7c;margin-bottom:6px"><span>응원·성장 추이</span><span style="color:#C9694C;font-weight:700">+18%</span></div>
              <svg viewBox="0 0 260 70" style="width:100%;height:60px;display:block"><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2B5A0" stop-opacity=".5"></stop><stop offset="1" stop-color="#F2B5A0" stop-opacity="0"></stop></linearGradient></defs><path d="M0,56 L33,52 L66,54 L99,42 L132,38 L165,26 L198,20 L231,12 L260,8 L260,70 L0,70 Z" fill="url(#g1)"></path><polyline points="0,56 33,52 66,54 99,42 132,38 165,26 198,20 231,12 260,8" fill="none" stroke="#E08A6F" stroke-width="2.5" stroke-linecap="round"></polyline></svg>
            </div>
          </div>
          <!-- floating chips -->
          <div style="position:absolute;top:0;right:0;display:flex;align-items:center;gap:8px;background:#211C18;color:#FBF6EF;padding:10px 15px;border-radius:999px;box-shadow:0 12px 24px rgba(33,28,24,.22);font-weight:700;font-size:14px;animation:floaty 5s ease-in-out infinite"><span class="mochi" style="width:18px;height:14px"></span> +312 응원</div>
          <div style="position:absolute;bottom:18px;left:0;display:flex;align-items:center;gap:8px;background:#7E9B82;color:#fff;padding:10px 15px;border-radius:999px;box-shadow:0 12px 24px rgba(126,155,130,.3);font-weight:700;font-size:14px;animation:floaty 6s ease-in-out infinite .6s"><span style="font-size:14px">✓</span> 스폰서 준비 완료</div>
        </div>
      </div>
    </div>

    <!-- logo / proof strip -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;padding:26px 56px;border-top:1px solid #ECE1D2;border-bottom:1px solid #ECE1D2;background:#F6ECDF">
      <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.04em;color:#9b8d7c;white-space:nowrap">함께하는 크리에이터</span>
      <div style="display:flex;align-items:center;gap:40px;flex:1;justify-content:space-around;opacity:.55">
        <span style="font-size:21px;font-weight:800;letter-spacing:-.03em">채널 ◆ 로고</span>
        <span style="font-size:21px;font-weight:800;letter-spacing:-.03em">STUDIO·KR</span>
        <span style="font-size:21px;font-weight:800;letter-spacing:-.03em">버추얼랩</span>
        <span style="font-size:21px;font-weight:800;letter-spacing:-.03em">MCN ❉</span>
        <span style="font-size:21px;font-weight:800;letter-spacing:-.03em">게임존</span>
      </div>
    </div>

    <!-- insight band (dark) -->
    <div style="background:#211C18;color:#F2E9DD;padding:88px 56px">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#E9A488;font-weight:500;margin-bottom:20px">왜 motoo 인가</div>
      <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:56px;align-items:end">
        <h2 style="margin:0;font-size:44px;line-height:1.2;font-weight:800;letter-spacing:-.03em;color:#FBF6EF">스폰서는 조회수보다<br><span style="color:#E9A488">진짜 팬덤</span>을 봅니다.</h2>
        <p style="margin:0;font-size:17px;line-height:1.7;color:#C9BCAD">중소 규모 크리에이터일수록 “충성도 높은 팬”이 강점이지만, 그걸 증명할 방법이 없었습니다. motoo는 응원·충성도·실행력을 검증 가능한 리포트로 만들어 드립니다.</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:48px">
        <div style="background:#2C2620;border:1px solid #3a322a;border-radius:18px;padding:24px"><div style="font-size:15px;font-weight:700;color:#FBF6EF;margin-bottom:8px">숫자는 많지만</div><div style="font-size:14.5px;line-height:1.6;color:#A99C8D">조회수·팔로워만으로는 “이 팬덤이 진짜인지”를 보여주기 어렵습니다.</div></div>
        <div style="background:#2C2620;border:1px solid #3a322a;border-radius:18px;padding:24px"><div style="font-size:15px;font-weight:700;color:#FBF6EF;margin-bottom:8px">후원은 흩어져 있고</div><div style="font-size:14.5px;line-height:1.6;color:#A99C8D">여러 플랫폼에 흩어진 응원 기록은 한눈에 정리되지 않습니다.</div></div>
        <div style="background:#2C2620;border:1px solid #3a322a;border-radius:18px;padding:24px"><div style="font-size:15px;font-weight:700;color:#FBF6EF;margin-bottom:8px">스폰서는 검증을 원합니다</div><div style="font-size:14.5px;line-height:1.6;color:#A99C8D">브랜드·MCN은 협업 전에 신뢰할 수 있는 데이터를 요구합니다.</div></div>
      </div>
    </div>

    <!-- how it works -->
    <div style="padding:96px 56px 80px">
      <div style="text-align:center;margin-bottom:54px">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#C9694C;font-weight:500;margin-bottom:16px">how it works</div>
        <h2 style="margin:0;font-size:46px;line-height:1.14;font-weight:800;letter-spacing:-.03em">응원이 증거가 되기까지, 세 단계</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:22px;padding:32px 28px;box-shadow:0 2px 4px rgba(33,28,24,.04)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:#C9694C;font-weight:600">01</span><span style="display:flex;gap:6px"><span class="mochi" style="width:30px;height:24px"></span><span class="mochi" style="width:30px;height:24px"></span></span></div>
          <h3 style="margin:0 0 10px;font-size:23px;font-weight:800;letter-spacing:-.02em">팬이 모찌로 응원해요</h3>
          <p style="margin:0;font-size:16px;line-height:1.6;color:#74695F">결제는 라이선스 PG를 통해 크리에이터에게 직접. 플랫폼은 자금을 보유하지 않습니다.</p>
        </div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:22px;padding:32px 28px;box-shadow:0 2px 4px rgba(33,28,24,.04)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:#C9694C;font-weight:600">02</span><span style="width:36px;height:36px;border-radius:11px;background:#FBE3D6;display:flex;align-items:center;justify-content:center;font-size:19px">🏅</span></div>
          <h3 style="margin:0 0 10px;font-size:23px;font-weight:800;letter-spacing:-.02em">핵심 팬에게 보상해요</h3>
          <p style="margin:0;font-size:16px;line-height:1.6;color:#74695F">백커 월·파운딩 배지·퍼크로 단골 팬을 챙기면 충성도가 쌓입니다.</p>
        </div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:22px;padding:32px 28px;box-shadow:0 2px 4px rgba(33,28,24,.04)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:#C9694C;font-weight:600">03</span><span style="width:36px;height:36px;border-radius:11px;background:#EAF0EA;display:flex;align-items:center;justify-content:center;font-size:18px">📄</span></div>
          <h3 style="margin:0 0 10px;font-size:23px;font-weight:800;letter-spacing:-.02em">트러스트 리포트로 증명해요</h3>
          <p style="margin:0;font-size:16px;line-height:1.6;color:#74695F">매달 자동 집계된 신뢰도 리포트를 스폰서에게 공유하세요.</p>
        </div>
      </div>
    </div>

    <!-- trust report showcase -->
    <div style="background:#F6E8DC;padding:90px 56px;border-top:1px solid #EFDFCD">
      <div style="display:grid;grid-template-columns:.85fr 1.15fr;gap:48px;align-items:center">
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#C9694C;font-weight:500;margin-bottom:18px">the trust report</div>
          <h2 style="margin:0;font-size:46px;line-height:1.16;font-weight:800;letter-spacing:-.03em">한 장으로 끝내는<br>신뢰 증명</h2>
          <p style="font-size:17.5px;line-height:1.65;color:#6f6356;margin:22px 0 26px">5개 영역을 매달 자동 집계해 <b style="color:#211C18">스폰서 준비도</b>로 보여줍니다. 비공개 대시보드로 깊게 관리하고, 공개용으로 깔끔하게 공유하세요.</p>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;align-items:center;gap:11px;font-size:16px;font-weight:600"><span style="width:24px;height:24px;border-radius:7px;background:#fff;border:1px solid #E4D8C8;display:flex;align-items:center;justify-content:center;color:#7E9B82">✓</span> 팬 서포트 · 충성도 · 실행력 · 성장</div>
            <div style="display:flex;align-items:center;gap:11px;font-size:16px;font-weight:600"><span style="width:24px;height:24px;border-radius:7px;background:#fff;border:1px solid #E4D8C8;display:flex;align-items:center;justify-content:center;color:#7E9B82">✓</span> Emerging / Strong / Excellent 등급</div>
            <div style="display:flex;align-items:center;gap:11px;font-size:16px;font-weight:600"><span style="width:24px;height:24px;border-radius:7px;background:#fff;border:1px solid #E4D8C8;display:flex;align-items:center;justify-content:center;color:#7E9B82">✓</span> 공개·비공개 두 가지 뷰 · 브랜더블</div>
          </div>
          <div style="margin-top:30px"><span style="display:inline-flex;align-items:center;gap:9px;padding:15px 26px;border-radius:13px;background:#211C18;color:#FBF6EF;font-weight:700;font-size:16px">샘플 리포트 전체 보기 →</span></div>
        </div>
        <!-- browser-framed report -->
        <div style="background:#fff;border:1px solid #E4D8C8;border-radius:18px;box-shadow:0 34px 70px rgba(33,28,24,.18);overflow:hidden">
          <div style="display:flex;align-items:center;gap:10px;padding:13px 18px;background:#FBF6EF;border-bottom:1px solid #EEE3D5"><span style="display:flex;gap:7px"><span style="width:11px;height:11px;border-radius:50%;background:#E5D3C0"></span><span style="width:11px;height:11px;border-radius:50%;background:#E5D3C0"></span><span style="width:11px;height:11px;border-radius:50%;background:#E5D3C0"></span></span><span style="flex:1;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#a99c8d">motoo.gg/r/creatorA · 공유용</span></div>
          <div style="padding:24px">
            <div style="display:flex;align-items:center;gap:13px;margin-bottom:20px">
              <image-slot id="cl_report_avatar" style="width:50px;height:50px" shape="circle" placeholder="아바타"></image-slot>
              <div style="flex:1"><div style="font-weight:800;font-size:19px">@크리에이터A</div><div style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#9b8d7c">TRUST REPORT · 2026년 6월</div></div>
              <div style="text-align:right"><div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#9b8d7c;margin-bottom:4px">SPONSOR READINESS</div><div style="display:inline-flex;align-items:center;gap:7px;padding:7px 15px;border-radius:999px;background:#EAF0EA;color:#4f6b53;font-weight:800;font-size:15px;border:1px solid #CFE0D2"><span style="width:8px;height:8px;border-radius:50%;background:#7E9B82"></span>STRONG</div></div>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:22px"><div style="flex:1;height:8px;border-radius:6px;background:#E3D6C6"></div><div style="flex:1;height:8px;border-radius:6px;background:#E08A6F"></div><div style="flex:1;height:8px;border-radius:6px;background:#E3D6C6"></div></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div style="background:#FBF6EF;border:1px solid #EEE3D5;border-radius:14px;padding:16px"><div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#9b8d7c;letter-spacing:.05em">FAN SUPPORT</div><div style="display:flex;align-items:baseline;gap:8px;margin-top:8px"><span style="font-size:28px;font-weight:800;letter-spacing:-.02em">312</span><span style="font-size:13px;color:#74695F">백커 · 평균 ₩6.4k</span></div><div style="display:flex;align-items:flex-end;gap:4px;height:30px;margin-top:10px"><span style="flex:1;height:40%;background:#E3D6C6;border-radius:3px"></span><span style="flex:1;height:55%;background:#E3D6C6;border-radius:3px"></span><span style="flex:1;height:48%;background:#E3D6C6;border-radius:3px"></span><span style="flex:1;height:70%;background:#EFC3AE;border-radius:3px"></span><span style="flex:1;height:85%;background:#E08A6F;border-radius:3px"></span><span style="flex:1;height:100%;background:#E08A6F;border-radius:3px"></span></div></div>
              <div style="background:#FBF6EF;border:1px solid #EEE3D5;border-radius:14px;padding:16px"><div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#9b8d7c;letter-spacing:.05em">FAN LOYALTY</div><div style="display:flex;align-items:baseline;gap:8px;margin-top:8px"><span style="font-size:28px;font-weight:800;letter-spacing:-.02em">41%</span><span style="font-size:13px;color:#74695F">재후원 · 핵심 48명</span></div><div style="display:flex;align-items:center;gap:10px;margin-top:10px"><div style="width:30px;height:30px;border-radius:50%;border:5px solid #E3D6C6;border-top-color:#E08A6F;border-right-color:#E08A6F"></div><span style="font-size:12px;color:#74695F">핵심 팬이 응원의 62%</span></div></div>
              <div style="background:#FBF6EF;border:1px solid #EEE3D5;border-radius:14px;padding:16px"><div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#9b8d7c;letter-spacing:.05em">EXECUTION</div><div style="display:flex;align-items:baseline;gap:8px;margin-top:8px"><span style="font-size:28px;font-weight:800;letter-spacing:-.02em">94%</span><span style="font-size:13px;color:#74695F">퍼크 이행</span></div><div style="height:8px;border-radius:6px;background:#E3D6C6;margin-top:12px;overflow:hidden"><div style="width:94%;height:100%;background:#7E9B82"></div></div></div>
              <div style="background:#FBF6EF;border:1px solid #EEE3D5;border-radius:14px;padding:16px"><div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#9b8d7c;letter-spacing:.05em">GROWTH</div><div style="display:flex;align-items:baseline;gap:8px;margin-top:8px"><span style="font-size:28px;font-weight:800;letter-spacing:-.02em">+18%</span><span style="font-size:13px;color:#74695F">팔로워 · +11% 시청자</span></div><svg viewBox="0 0 150 32" style="width:100%;height:30px;margin-top:8px"><polyline points="0,28 25,24 50,25 75,17 100,13 125,7 150,3" fill="none" stroke="#E08A6F" stroke-width="2.5" stroke-linecap="round"></polyline></svg></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- mochi explainer -->
    <div style="padding:72px 56px">
      <div style="background:#fff;border:1px solid #EEE3D5;border-radius:24px;padding:40px 44px;display:flex;align-items:center;gap:36px;box-shadow:0 2px 4px rgba(33,28,24,.04)">
        <div style="display:flex;gap:8px;flex:none"><span class="mochi" style="width:58px;height:46px"></span><span class="mochi" style="width:46px;height:38px;align-self:flex-end"></span></div>
        <div style="flex:1">
          <h3 style="margin:0;font-size:28px;font-weight:800;letter-spacing:-.02em">모찌는 <span style="color:#C9694C">응원</span>입니다 — 투자가 아닙니다.</h3>
          <p style="margin:10px 0 0;font-size:17px;line-height:1.6;color:#74695F">환급·재판매·수익이 없습니다. 받는 건 팬의 마음과 신뢰, 그리고 데이터입니다. 결제는 라이선스 PG를 통해 크리에이터에게 직접 전달됩니다.</p>
        </div>
      </div>
    </div>

    <!-- creator features -->
    <div style="padding:24px 56px 92px">
      <h2 style="margin:0 0 36px;font-size:34px;font-weight:800;letter-spacing:-.03em">크리에이터를 위한 모든 도구</h2>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px">
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:18px;padding:24px 20px"><div style="width:40px;height:40px;border-radius:11px;background:#FBE3D6;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:16px">👥</div><div style="font-weight:800;font-size:17px;margin-bottom:6px">팬 CRM</div><div style="font-size:13.5px;line-height:1.55;color:#74695F">세그먼트·메모·DM으로 단골 관리</div></div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:18px;padding:24px 20px"><div style="width:40px;height:40px;border-radius:11px;background:#EAF0EA;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:16px">✅</div><div style="font-weight:800;font-size:17px;margin-bottom:6px">퍼크 트래커</div><div style="font-size:13.5px;line-height:1.55;color:#74695F">약속한 퍼크의 이행을 체크</div></div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:18px;padding:24px 20px"><div style="width:40px;height:40px;border-radius:11px;background:#FBE3D6;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:16px">💸</div><div style="font-weight:800;font-size:17px;margin-bottom:6px">정산·출금</div><div style="font-size:13.5px;line-height:1.55;color:#74695F">PG 정산 현황을 투명하게</div></div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:18px;padding:24px 20px"><div style="width:40px;height:40px;border-radius:11px;background:#EAF0EA;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:16px">📈</div><div style="font-weight:800;font-size:17px;margin-bottom:6px">분석</div><div style="font-size:13.5px;line-height:1.55;color:#74695F">성장·유입·시청자 인사이트</div></div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:18px;padding:24px 20px"><div style="width:40px;height:40px;border-radius:11px;background:#FBE3D6;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:16px">🔗</div><div style="font-weight:800;font-size:17px;margin-bottom:6px">공유용 리포트</div><div style="font-size:13.5px;line-height:1.55;color:#74695F">링크·임베드로 스폰서에게</div></div>
      </div>
    </div>

    <!-- testimonial -->
    <div style="background:#211C18;color:#F2E9DD;padding:84px 56px">
      <div style="max-width:880px">
        <div style="font-size:46px;line-height:1.34;font-weight:700;letter-spacing:-.02em;color:#FBF6EF">“시청자 수는 작아도 우리 팬덤이 얼마나 단단한지 보여줄 수 있게 됐어요. 트러스트 리포트 덕분에 첫 브랜드 협업을 따냈습니다.”</div>
        <div style="display:flex;align-items:center;gap:14px;margin-top:34px">
          <image-slot id="cl_quote_avatar" style="width:52px;height:52px" shape="circle" placeholder="아바타"></image-slot>
          <div><div style="font-weight:700;font-size:17px;color:#FBF6EF">@크리에이터A</div><div style="font-size:14px;color:#A99C8D">버추얼 · 평균 시청자 120명</div></div>
        </div>
      </div>
    </div>

    <!-- safety strip -->
    <div style="padding:40px 56px;display:flex;align-items:center;justify-content:center;gap:44px;flex-wrap:wrap;border-bottom:1px solid #ECE1D2">
      <span style="display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;color:#5c5246"><span style="width:30px;height:30px;border-radius:9px;background:#F1E4D4;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800">19</span> 연령 확인 · 성인 인증</span>
      <span style="display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;color:#5c5246"><span style="width:30px;height:30px;border-radius:9px;background:#F1E4D4;display:flex;align-items:center;justify-content:center;font-size:15px">↩</span> 환불 · 청약철회 정책</span>
      <span style="display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;color:#5c5246"><span style="width:30px;height:30px;border-radius:9px;background:#F1E4D4;display:flex;align-items:center;justify-content:center;font-size:14px">🔒</span> 라이선스 PG 직접 결제 · 자금 미보유</span>
    </div>

    <!-- final CTA -->
    <div style="background:#E08A6F;color:#fff;padding:96px 56px;text-align:center;position:relative;overflow:hidden">
      <div style="position:absolute;top:-60px;left:-40px;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,.12)"></div>
      <div style="position:absolute;bottom:-90px;right:-30px;width:340px;height:340px;border-radius:50%;background:rgba(33,28,24,.08)"></div>
      <div style="position:relative">
        <h2 style="margin:0;font-size:50px;line-height:1.16;font-weight:800;letter-spacing:-.03em">지금, 당신의 팬덤을 증명하세요.</h2>
        <p style="font-size:18px;color:rgba(255,255,255,.86);margin:18px 0 32px">신청은 5분, 첫 리포트는 다음 달부터.</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:14px"><span style="padding:17px 34px;border-radius:14px;background:#211C18;color:#FBF6EF;font-weight:700;font-size:17px">크리에이터로 신청하기 →</span><span style="padding:17px 28px;border-radius:14px;background:rgba(255,255,255,.16);color:#fff;font-weight:700;font-size:17px;border:1.5px solid rgba(255,255,255,.5)">후원자이신가요? ↗</span></div>
      </div>
    </div>

    <!-- footer -->
    <div style="background:#211C18;color:#C9BCAD;padding:56px 56px 40px">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:40px">
        <div style="max-width:300px"><div style="display:flex;align-items:center;gap:9px;margin-bottom:14px"><span class="mochi" style="width:24px;height:19px"></span><span style="font-size:22px;font-weight:800;color:#FBF6EF;letter-spacing:-.04em">motoo</span></div><div style="font-size:14px;line-height:1.6;color:#A99C8D">팬의 응원을 스폰서에게 보여줄 증거로. 크리에이터를 위한 신뢰 플랫폼.</div></div>
        <div style="display:flex;gap:56px;flex-wrap:wrap">
          <div><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;color:#7d7164;margin-bottom:14px">제품</div><div style="display:flex;flex-direction:column;gap:10px;font-size:14px"><span>트러스트 리포트</span><span>크리에이터 대시보드</span><span>모찌</span><span>후원자용 ↗</span></div></div>
          <div><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;color:#7d7164;margin-bottom:14px">회사</div><div style="display:flex;flex-direction:column;gap:10px;font-size:14px"><span>소개</span><span>고객센터</span><span>공지사항</span></div></div>
          <div><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;color:#7d7164;margin-bottom:14px">약관</div><div style="display:flex;flex-direction:column;gap:10px;font-size:14px"><span>이용약관</span><span>개인정보처리방침</span><span style="text-decoration:underline">환불·청약철회</span></div></div>
        </div>
      </div>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#7d7164;margin-top:40px;border-top:1px solid #3a322a;padding-top:18px;line-height:1.6">(주)모투 · 통신판매중개업자 · 결제는 각 크리에이터(판매자)와 직접 이루어지며 플랫폼은 자금을 보유하지 않습니다.</div>
    </div>

  </div>
</div>


<!-- ================= USER (FAN) LANDING ================= -->
<div style="position:absolute;left:1640px;top:96px;width:1440px">
  <div data-drags-parent="1" style="position:absolute;top:-26px;font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.06em;color:#8a7d6c">motoo for fans · 후원자 랜딩</div>
  <div style="background:#FBF6EF;border:1px solid #ECE1D2;border-radius:16px;box-shadow:0 30px 80px rgba(33,28,24,.14);overflow:hidden;font-family:'Pretendard',sans-serif;color:#211C18">

    <!-- nav -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 56px;border-bottom:1px solid #ECE1D2;background:rgba(251,246,239,.9)">
      <div style="display:flex;align-items:center;gap:10px"><span class="mochi" style="width:26px;height:21px"></span><span style="font-size:24px;font-weight:800;letter-spacing:-.04em">motoo</span></div>
      <div style="display:flex;align-items:center;gap:30px;font-size:15px;font-weight:500;color:#5c5246">
        <span>둘러보기</span><span>모찌란?</span>
        <span style="display:flex;align-items:center;gap:5px;color:#9b8d7c;font-size:14px">크리에이터용 <span style="font-size:12px">↗</span></span>
        <span style="color:#211C18;font-weight:600">로그인</span>
        <span style="padding:11px 20px;border-radius:12px;background:#E08A6F;color:#fff;font-weight:700;box-shadow:0 6px 16px rgba(224,138,111,.3)">회원가입</span>
      </div>
    </div>

    <!-- hero -->
    <div style="position:relative;padding:78px 56px 64px;text-align:center;overflow:hidden;background:#F6E8DC">
      <div style="position:absolute;top:40px;left:90px;width:64px;height:52px;animation:floaty 6s ease-in-out infinite" class="mochi"></div>
      <div style="position:absolute;top:120px;right:120px;width:46px;height:38px;animation:floaty 5s ease-in-out infinite .5s" class="mochi"></div>
      <div style="position:absolute;bottom:30px;left:200px;width:38px;height:31px;animation:floaty 7s ease-in-out infinite .2s" class="mochi"></div>
      <div style="position:relative">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#C9694C;font-weight:500;margin-bottom:22px">motoo for fans</div>
        <h1 style="margin:0;font-size:60px;line-height:1.12;font-weight:800;letter-spacing:-.035em">좋아하는 크리에이터를,<br><span style="color:#C9694C">모찌</span>로 응원하세요.</h1>
        <p style="font-size:19px;line-height:1.6;color:#74695F;margin:24px auto 32px;max-width:520px">마음을 전하고, 단골 팬만의 혜택과 파운딩 배지를 받으세요. 응원할수록 크리에이터와 더 가까워져요.</p>
        <!-- search -->
        <div style="display:flex;gap:10px;max-width:560px;margin:0 auto 16px"><div style="flex:1;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #E4D8C8;border-radius:15px;padding:15px 20px;color:#9b8d7c;font-size:16px;text-align:left"><span>🔍</span> 크리에이터·카테고리 검색</div><span style="padding:15px 28px;border-radius:15px;background:#E08A6F;color:#fff;font-weight:700;font-size:16px;box-shadow:0 8px 18px rgba(224,138,111,.3)">검색</span></div>
        <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap;margin-top:18px">
          <span style="padding:9px 18px;border-radius:999px;background:#211C18;color:#FBF6EF;font-size:14.5px;font-weight:600">전체</span>
          <span style="padding:9px 18px;border-radius:999px;background:#fff;border:1px solid #E4D8C8;font-size:14.5px;font-weight:500">게임</span>
          <span style="padding:9px 18px;border-radius:999px;background:#fff;border:1px solid #E4D8C8;font-size:14.5px;font-weight:500">일상</span>
          <span style="padding:9px 18px;border-radius:999px;background:#fff;border:1px solid #E4D8C8;font-size:14.5px;font-weight:500">음악</span>
          <span style="padding:9px 18px;border-radius:999px;background:#fff;border:1px solid #E4D8C8;font-size:14.5px;font-weight:500">버추얼</span>
          <span style="padding:9px 18px;border-radius:999px;background:#fff;border:1px solid #E4D8C8;font-size:14.5px;font-weight:500">공부</span>
        </div>
      </div>
    </div>

    <!-- trending creators -->
    <div style="padding:80px 56px">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:32px">
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#C9694C;font-weight:500;margin-bottom:12px">discover</div>
          <h2 style="margin:0;font-size:40px;font-weight:800;letter-spacing:-.03em">지금 뜨는 크리에이터</h2>
        </div>
        <span style="font-size:15px;font-weight:600;color:#9b8d7c">전체 둘러보기 →</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:20px;overflow:hidden;box-shadow:0 2px 4px rgba(33,28,24,.04)">
          <div style="position:relative"><image-slot id="ul_trend_1" style="width:100%;height:150px;display:block" shape="rect" placeholder="썸네일"></image-slot><span style="position:absolute;top:12px;left:12px;display:flex;align-items:center;gap:5px;background:#E0584C;color:#fff;font-size:11.5px;font-weight:800;padding:4px 10px;border-radius:999px"><span style="width:6px;height:6px;border-radius:50%;background:#fff"></span>LIVE</span></div>
          <div style="padding:16px"><div style="display:flex;align-items:center;gap:9px"><image-slot id="ul_trend_a1" style="width:34px;height:34px" shape="circle" placeholder=""></image-slot><div><div style="font-weight:800;font-size:15.5px">@크리에이터A</div><div style="font-size:12px;color:#9b8d7c">게임 · 240명 시청</div></div></div><div style="display:flex;align-items:center;justify-content:center;gap:7px;margin-top:14px;padding:11px;border-radius:12px;background:#FBE3D6;color:#C9694C;font-weight:700;font-size:14.5px"><span class="mochi" style="width:17px;height:14px"></span> 응원하기</div></div>
        </div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:20px;overflow:hidden;box-shadow:0 2px 4px rgba(33,28,24,.04)">
          <div style="position:relative"><image-slot id="ul_trend_2" style="width:100%;height:150px;display:block" shape="rect" placeholder="썸네일"></image-slot></div>
          <div style="padding:16px"><div style="display:flex;align-items:center;gap:9px"><image-slot id="ul_trend_a2" style="width:34px;height:34px" shape="circle" placeholder=""></image-slot><div><div style="font-weight:800;font-size:15.5px">@크리에이터C</div><div style="font-size:12px;color:#9b8d7c">음악 · 평균 240명</div></div></div><div style="display:flex;align-items:center;justify-content:center;gap:7px;margin-top:14px;padding:11px;border-radius:12px;background:#FBE3D6;color:#C9694C;font-weight:700;font-size:14.5px"><span class="mochi" style="width:17px;height:14px"></span> 응원하기</div></div>
        </div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:20px;overflow:hidden;box-shadow:0 2px 4px rgba(33,28,24,.04)">
          <div style="position:relative"><image-slot id="ul_trend_3" style="width:100%;height:150px;display:block" shape="rect" placeholder="썸네일"></image-slot><span style="position:absolute;top:12px;left:12px;display:flex;align-items:center;gap:5px;background:#E0584C;color:#fff;font-size:11.5px;font-weight:800;padding:4px 10px;border-radius:999px"><span style="width:6px;height:6px;border-radius:50%;background:#fff"></span>LIVE</span></div>
          <div style="padding:16px"><div style="display:flex;align-items:center;gap:9px"><image-slot id="ul_trend_a3" style="width:34px;height:34px" shape="circle" placeholder=""></image-slot><div><div style="font-weight:800;font-size:15.5px">@크리에이터E</div><div style="font-size:12px;color:#9b8d7c">버추얼 · 300명 시청</div></div></div><div style="display:flex;align-items:center;justify-content:center;gap:7px;margin-top:14px;padding:11px;border-radius:12px;background:#FBE3D6;color:#C9694C;font-weight:700;font-size:14.5px"><span class="mochi" style="width:17px;height:14px"></span> 응원하기</div></div>
        </div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:20px;overflow:hidden;box-shadow:0 2px 4px rgba(33,28,24,.04)">
          <div style="position:relative"><image-slot id="ul_trend_4" style="width:100%;height:150px;display:block" shape="rect" placeholder="썸네일"></image-slot></div>
          <div style="padding:16px"><div style="display:flex;align-items:center;gap:9px"><image-slot id="ul_trend_a4" style="width:34px;height:34px" shape="circle" placeholder=""></image-slot><div><div style="font-weight:800;font-size:15.5px">@크리에이터B</div><div style="font-size:12px;color:#9b8d7c">일상 · 평균 80명</div></div></div><div style="display:flex;align-items:center;justify-content:center;gap:7px;margin-top:14px;padding:11px;border-radius:12px;background:#FBE3D6;color:#C9694C;font-weight:700;font-size:14.5px"><span class="mochi" style="width:17px;height:14px"></span> 응원하기</div></div>
        </div>
      </div>
    </div>

    <!-- how mochi works (fan POV) -->
    <div style="background:#211C18;color:#F2E9DD;padding:88px 56px">
      <div style="text-align:center;margin-bottom:50px">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#E9A488;font-weight:500;margin-bottom:16px">how mochi works</div>
        <h2 style="margin:0;font-size:42px;font-weight:800;letter-spacing:-.03em;color:#FBF6EF">모찌로 응원하는 법</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
        <div style="background:#2C2620;border:1px solid #3a322a;border-radius:22px;padding:32px 28px"><div style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:#E9A488;font-weight:600;margin-bottom:18px">01</div><h3 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#FBF6EF">크리에이터 찾기</h3><p style="margin:0;font-size:15.5px;line-height:1.6;color:#A99C8D">둘러보기·검색으로 응원하고 싶은 크리에이터를 발견하세요.</p></div>
        <div style="background:#2C2620;border:1px solid #3a322a;border-radius:22px;padding:32px 28px"><div style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:#E9A488;font-weight:600;margin-bottom:18px">02</div><h3 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#FBF6EF">모찌 보내기</h3><p style="margin:0;font-size:15.5px;line-height:1.6;color:#A99C8D">원하는 만큼 모찌를 보내요. 결제는 크리에이터에게 직접 전달됩니다.</p></div>
        <div style="background:#2C2620;border:1px solid #3a322a;border-radius:22px;padding:32px 28px"><div style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:#E9A488;font-weight:600;margin-bottom:18px">03</div><h3 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#FBF6EF">혜택·배지 받기</h3><p style="margin:0;font-size:15.5px;line-height:1.6;color:#A99C8D">백커 월·퍼크·파운딩 배지로 단골 팬이 되어요.</p></div>
      </div>
    </div>

    <!-- why mochi (benefits) -->
    <div style="padding:92px 56px">
      <h2 style="margin:0 0 40px;font-size:40px;font-weight:800;letter-spacing:-.03em;text-align:center">응원하면 이런 게 좋아요</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:20px;padding:30px 32px;display:flex;gap:20px;align-items:flex-start"><div style="width:48px;height:48px;border-radius:14px;background:#FBE3D6;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none">💌</div><div><h3 style="margin:0 0 7px;font-size:21px;font-weight:800">마음을 전해요</h3><p style="margin:0;font-size:15.5px;line-height:1.6;color:#74695F">응원 메시지와 함께 모찌를 보내 크리에이터에게 직접 닿아요.</p></div></div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:20px;padding:30px 32px;display:flex;gap:20px;align-items:flex-start"><div style="width:48px;height:48px;border-radius:14px;background:#EAF0EA;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none">🎁</div><div><h3 style="margin:0 0 7px;font-size:21px;font-weight:800">단골 혜택을 받아요</h3><p style="margin:0;font-size:15.5px;line-height:1.6;color:#74695F">디스코드 채널·추첨·손편지 등 서포터만의 퍼크를 누려요.</p></div></div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:20px;padding:30px 32px;display:flex;gap:20px;align-items:flex-start"><div style="width:48px;height:48px;border-radius:14px;background:#FBE3D6;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none">🏅</div><div><h3 style="margin:0 0 7px;font-size:21px;font-weight:800">파운딩 배지로 인정받아요</h3><p style="margin:0;font-size:15.5px;line-height:1.6;color:#74695F">먼저 응원한 팬일수록 백커 월·리더보드에서 특별한 상태를 가져요.</p></div></div>
        <div style="background:#fff;border:1px solid #EEE3D5;border-radius:20px;padding:30px 32px;display:flex;gap:20px;align-items:flex-start"><div style="width:48px;height:48px;border-radius:14px;background:#EAF0EA;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none">📒</div><div><h3 style="margin:0 0 7px;font-size:21px;font-weight:800">내 응원을 한눈에</h3><p style="margin:0;font-size:15.5px;line-height:1.6;color:#74695F">내 대시보드에서 후원 내역·팔로잉·예정된 퍼크를 모아 봐요.</p></div></div>
      </div>
    </div>

    <!-- spotlight creator -->
    <div style="padding:0 56px 92px">
      <div style="background:#fff;border:1px solid #EEE3D5;border-radius:24px;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;box-shadow:0 8px 24px rgba(33,28,24,.06)">
        <image-slot id="ul_spotlight" style="width:100%;height:100%;min-height:340px;display:block" shape="rect" placeholder="스포트라이트 이미지"></image-slot>
        <div style="padding:48px 44px">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#C9694C;font-weight:500;margin-bottom:16px">이주의 크리에이터</div>
          <h2 style="margin:0;font-size:34px;font-weight:800;letter-spacing:-.03em">@크리에이터C</h2>
          <p style="font-size:16.5px;line-height:1.6;color:#74695F;margin:14px 0 24px">매주 화·목·토 라이브 음악 방송. 312명의 백커가 함께하는 따뜻한 커뮤니티예요.</p>
          <div style="display:flex;gap:28px;margin-bottom:28px">
            <div><div style="font-size:24px;font-weight:800">312</div><div style="font-size:13px;color:#9b8d7c">백커</div></div>
            <div><div style="font-size:24px;font-weight:800;display:flex;align-items:center;gap:6px"><span class="mochi" style="width:18px;height:14px"></span>3.1k</div><div style="font-size:13px;color:#9b8d7c">받은 모찌</div></div>
            <div><div style="font-size:24px;font-weight:800;color:#7E9B82">STRONG</div><div style="font-size:13px;color:#9b8d7c">신뢰도</div></div>
          </div>
          <span style="display:inline-flex;align-items:center;gap:9px;padding:15px 28px;border-radius:13px;background:#E08A6F;color:#fff;font-weight:700;font-size:16px;box-shadow:0 8px 18px rgba(224,138,111,.3)"><span class="mochi" style="width:18px;height:14px"></span> 모찌 보내기</span>
        </div>
      </div>
    </div>

    <!-- mochi explainer (warm) -->
    <div style="padding:0 56px 80px">
      <div style="background:#F6E8DC;border:1px solid #EFDFCD;border-radius:24px;padding:44px;text-align:center">
        <div style="display:flex;justify-content:center;gap:10px;margin-bottom:18px"><span class="mochi" style="width:44px;height:36px"></span><span class="mochi" style="width:56px;height:46px"></span><span class="mochi" style="width:40px;height:33px"></span></div>
        <h3 style="margin:0;font-size:28px;font-weight:800;letter-spacing:-.02em">모찌는 <span style="color:#C9694C">응원</span>이에요 — 투자가 아니에요.</h3>
        <p style="margin:12px auto 0;font-size:16.5px;line-height:1.6;color:#6f6356;max-width:620px">환급·재판매·수익이 없어요. 받는 건 크리에이터의 감사, 단골 혜택, 그리고 팬으로서의 상태(배지·순위)예요. 잔액이나 가치로 표시되지 않아요.</p>
      </div>
    </div>

    <!-- safety strip -->
    <div style="padding:40px 56px;display:flex;align-items:center;justify-content:center;gap:44px;flex-wrap:wrap;border-top:1px solid #ECE1D2;border-bottom:1px solid #ECE1D2">
      <span style="display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;color:#5c5246"><span style="width:30px;height:30px;border-radius:9px;background:#F1E4D4;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800">19</span> 연령 확인 · 성인 인증</span>
      <span style="display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;color:#5c5246"><span style="width:30px;height:30px;border-radius:9px;background:#F1E4D4;display:flex;align-items:center;justify-content:center;font-size:15px">↩</span> 환불 · 청약철회 정책</span>
      <span style="display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;color:#5c5246"><span style="width:30px;height:30px;border-radius:9px;background:#F1E4D4;display:flex;align-items:center;justify-content:center;font-size:14px">🔒</span> 라이선스 PG 직접 결제</span>
    </div>

    <!-- final CTA -->
    <div style="background:#E08A6F;color:#fff;padding:92px 56px;text-align:center;position:relative;overflow:hidden">
      <div style="position:absolute;top:30px;left:140px;width:50px;height:41px;background:rgba(255,255,255,.22);border-radius:46% 46% 48% 48%/52% 52% 48% 48%"></div>
      <div style="position:absolute;bottom:40px;right:160px;width:64px;height:52px;background:rgba(33,28,24,.1);border-radius:46% 46% 48% 48%/52% 52% 48% 48%"></div>
      <div style="position:relative">
        <h2 style="margin:0;font-size:48px;line-height:1.16;font-weight:800;letter-spacing:-.03em">오늘, 첫 응원을 보내보세요.</h2>
        <p style="font-size:18px;color:rgba(255,255,255,.86);margin:18px 0 32px">좋아하는 크리에이터에게 마음을 전하는 가장 따뜻한 방법.</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:14px"><span style="padding:17px 34px;border-radius:14px;background:#211C18;color:#FBF6EF;font-weight:700;font-size:17px">크리에이터 둘러보기 →</span><span style="padding:17px 28px;border-radius:14px;background:rgba(255,255,255,.16);color:#fff;font-weight:700;font-size:17px;border:1.5px solid rgba(255,255,255,.5)">회원가입</span></div>
      </div>
    </div>

    <!-- footer -->
    <div style="background:#211C18;color:#C9BCAD;padding:56px 56px 40px">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:40px">
        <div style="max-width:300px"><div style="display:flex;align-items:center;gap:9px;margin-bottom:14px"><span class="mochi" style="width:24px;height:19px"></span><span style="font-size:22px;font-weight:800;color:#FBF6EF;letter-spacing:-.04em">motoo</span></div><div style="font-size:14px;line-height:1.6;color:#A99C8D">좋아하는 크리에이터를 응원하는 가장 따뜻한 방법.</div></div>
        <div style="display:flex;gap:56px;flex-wrap:wrap">
          <div><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;color:#7d7164;margin-bottom:14px">둘러보기</div><div style="display:flex;flex-direction:column;gap:10px;font-size:14px"><span>크리에이터</span><span>카테고리</span><span>모찌란?</span><span>크리에이터용 ↗</span></div></div>
          <div><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;color:#7d7164;margin-bottom:14px">지원</div><div style="display:flex;flex-direction:column;gap:10px;font-size:14px"><span>고객센터</span><span>자주 묻는 질문</span><span>안전·신뢰</span></div></div>
          <div><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;color:#7d7164;margin-bottom:14px">약관</div><div style="display:flex;flex-direction:column;gap:10px;font-size:14px"><span>이용약관</span><span>개인정보처리방침</span><span style="text-decoration:underline">환불·청약철회</span></div></div>
        </div>
      </div>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#7d7164;margin-top:40px;border-top:1px solid #3a322a;padding-top:18px;line-height:1.6">모찌는 응원이며 투자·환급·재판매·수익이 없습니다 · 결제는 각 크리에이터(판매자)와 직접 이루어집니다.</div>
    </div>

  </div>
</div></x-dc>
</body>
</html>
