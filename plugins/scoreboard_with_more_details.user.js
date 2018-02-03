// ==UserScript==
// @id             iitc-plugin-scorestats@st1n0
// @name           IITC plugin: show a scoreboard with more details
// @version        0.1.0.20180203.010101
// @category       Info
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    [iitc-2018-02-03-010101] Display a scoreboard with all CPs and some more details like needed MUs to win the cycle.
// @updateURL      https://st1n0.net/dls/iitc_plugin_scorestats.js
// @downloadURL    https://st1n0.net/dls/iitc_plugin_scorestats.js
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if(typeof window.plugin !== 'function') window.plugin = function() {};

    //PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
    //(leaving them in place might break the 'About IITC' page or break update checks)
    plugin_info.buildName = 'iitc';
    plugin_info.dateTimeVersion = '20180202.10101';
    plugin_info.pluginId = 'scorestats';
    //END PLUGIN AUTHORS NOTE


    // PLUGIN START //

    // use own namespace for plugin
    window.plugin.scorestats = function() {

        var latLng = map.getCenter();
        var latE6 = Math.round(latLng.lat*1E6);
        var lngE6 = Math.round(latLng.lng*1E6);
        var dlg = dialog({title:'Region scores',html:'Loading regional scores...',width:560,minHeight:620});
        window.postAjax('getRegionScoreDetails', {latE6:latE6,lngE6:lngE6}, function(res){regionScoreStatsSuccess(res,dlg);}, function(){regionScoreStatsFailure(dlg);});
    };

    function regionScoreStatsSuccess(data,dlg) {
        dlg.html('<div class="cellscore">'
                 +'<b>Region score statistics for '+data.result.regionName+'</b><hr />'
                 //                +'<div><table>'+teamRow[first]+teamRow[1-first]+'</table>'
                 //                +'<b>Checkpoint overview</b>'
                 +'<div>'+regionScoreboardScoreHistoryStatisticsTable(data.result)+'</div>'
                 +'</div>');
    }


    function regionScoreboardScoreHistoryStatisticsTable(result) {
        var history = result.scoreHistory;
        var history_rev = result.scoreHistory;
        history_rev.reverse();
        var table = '<table width="100%"><tr><td align="center"><table><thead><tr><th>CP</th><th>ENL abs</th><th>RES abs</th><th>|</th><th>ENL avg</th><th>RES avg</th><th>diff avg</th><th>|</th><th>DELTA abs</th><th>DELTA/CP</th></tr></thead><tbody>';
        var enl_sum=enl_avg=res_sum=res_avg=avg_diff=sum_tmp_min=sum_tmp_max=avg_tmp=avg_diff_tmp=0;
        for(var i=0; i<history.length; i++) {
            enl_sum += +history_rev[i][1];
            enl_avg  = Math.round(enl_sum/(i+1),0);
            res_sum += +history_rev[i][2];
            res_avg  = Math.round(res_sum/(i+1),0);
            avg_diff = Math.round(enl_avg-res_avg,0);
            sum_tmp_min = sum_tmp_max = avg_tmp = avg_diff_tmp = 0;

            sum_tmp_min = res_sum;
			sum_tmp_max = enl_sum;
			avg_subtrahend = enl_avg;
            if (avg_diff<0 ) {
				sum_tmp_min = enl_sum;
				sum_tmp_max = res_sum;
				avg_subtrahend = res_avg;
			}
            // step 1000
            do {
                sum_tmp_min += 1000;
                avg_tmp  = Math.round(sum_tmp_min/(i+1),0);
                avg_diff_tmp = Math.round(avg_tmp - avg_subtrahend,0);
            }while(avg_diff_tmp < 0);

            sum_tmp_min -= 1010;
            // step 1
            do {
                avg_tmp  = Math.round(++sum_tmp_min/(i+1),0);
                avg_diff_tmp = Math.round(avg_tmp - avg_subtrahend,0);
            }while(avg_diff_tmp < 0);

            var mark_abs_enl1 = mark_abs_res1 = mark_avg_enl1 = mark_avg_res1 = '<u><b>';
            var mark_abs_enl2 = mark_abs_res2 = mark_avg_enl2 = mark_avg_res2 = '</b></u>';

            if (+history[i][1] > +history[i][2]) {
				mark_abs_res1 = '<font style="color:darkgrey">';
				mark_abs_res2 = '</font>';
			} else {
				mark_abs_enl1 = '<font style="color:darkgrey">';
				mark_abs_enl2 = '</font>';
			}

            if(enl_avg>res_avg) {
                mark_avg_res1 = '<font style="color:darkgrey">';
                mark_avg_res2 = '</font>';
            } else {
                mark_avg_enl1 = '<font style="color:darkgrey">';
                mark_avg_enl2 = '</font>';
            }

            var diff = sum_tmp_min-enl_sum;
            if(enl_avg>res_avg) diff = sum_tmp_min-res_sum;

            var remaining_cps = 1;
            if (+history.length<35) remaining_cps=34-i;

            table += '<tr>'
                + '<td>' + history[i][0] + '</td>'
                + '<td><nobr>' + mark_abs_enl1 + digits(history[i][1]) + mark_abs_enl2 + '</nobr></td>'
                + '<td><nobr>' + mark_abs_res1 + digits(history[i][2]) + mark_abs_res2 + '</nobr></td>'
                + '<td>|</td>'
                + '<td><nobr>' + mark_avg_enl1 + digits(enl_avg) + mark_avg_enl2 + '</nobr></td>'
                + '<td><nobr>' + mark_avg_res1 + digits(res_avg) + mark_avg_res2 + '</nobr></td>'
                + '<td><nobr><i>' + digits(Math.abs(avg_diff)) + '</i></nobr></td>'
                + '<td>|</td>'
                + '<td><nobr>' + digits(Math.abs(diff)) + '</nobr></td>'
                + '<td><nobr>' + digits(Math.abs(Math.round((diff) / remaining_cps,0))) + '</nobr></td>'
                + '</tr>';
        }
        var neededMUsFor = ' RES ';
        if (enl_avg<res_avg) neededMUsFor = ' ENL ';
        table += ' <tfoot><tr><td>&nbsp;</td><td colspan="2" align="center"><hr /></td><td>&nbsp;</td><td colspan="3" align="center"><hr /></td><td>&nbsp;</td><td align="center" colspan="2"><hr /></td></tr>';
        table += '<tr><td>&nbsp;</td><td colspan="2" align="center">absolute values</td><td>&nbsp;</td><td colspan="3" align="center">average values</td><td>&nbsp;</td><td align="center" colspan="2">missing MUs for ' + neededMUsFor + ' <br />to reach a draw</td></tr></tfoot>';
        table += '</tbody></table></td></tr></table>';
        return table;
    }


    function regionScoreStatsFailure(dlg) {
        dlg.html('Failed to load scores stats - try again');
    }


    window.plugin.scorestats.displayScoreStats =  function() {
        console.log('huhu displayScoreStats');
    };


    var setup =  function() {
      $('#toolbox').append(' <a onclick="window.plugin.scorestats()" title="Display a scorestats in the current view">ScoreStats</a>');
    };


    // PLUGIN END //////////////////////////////////////////////////////////

    setup.info = plugin_info; //add the script info data to the function as a property
    if(!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end

// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);




